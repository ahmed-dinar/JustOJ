/*
 *
 * Author: Ahmed Dinar
 * Last Modified: 21 Aug,2017
 * 			- write frbidden system calls name
 *
 *
 * TO COMPILE: gcc myutil.c -o safejudge final.c
 *
 * sudo cp -i safejudge /home/ahmed-dinar/JustOJ/helpers/compiler/sandbox
 *
 */

#include <sys/ptrace.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <sys/user.h>
#include <sys/resource.h>
#include <sys/time.h>
#include <sys/reg.h>


#include <errno.h>
#include <dirent.h>
#include <fcntl.h>
#include <pwd.h>
#include <unistd.h>
#include <signal.h>

#include <stdio.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "allSignals.h"
#include "allSyscalls.h"
#include "allowedSyscalls.h"
#include "myutil.h"


#define SYSTEM_ERROR   -1
#define OK              0
#define RE              1
#define TLE             2
#define MLE             3
#define OLE             4


char *CHROOT_DIR = "/var/SECURITY/JAIL/";
char *RUN_DIR = "/home/runs/";
char *programFile;
char *inputFile;
char *outputFile;
char *stderrFile;
char *resultFile;
int cpuLimit = 5000;   //default 5 seconds
int memoryLimit = 256; //default 256 MegaByte

int callCount[340] = {};
int memoryUsed  = 0;
int mainReturn = 0;

uid_t curUid,childUid;
gid_t curGid,childGid;
pid_t pid;


/*
 *
 *
 * */
void writeResult(int resCode,char *res,double cpuUsage,int memUsage,char *whyError) {

    if(pid > 0) kill(pid, SIGKILL);

#ifdef DEBUG
    fprintf(stderr ,"Starting writeResult..\n%d\t%s\t[%s]\nCPU: %lf s\t memory: %dKB / %dMB\n",resCode,res,whyError,cpuUsage,memUsage, KBtoMB(memUsage)); exit(1);
#endif

	
    FILE *fp = fopen(resultFile, "w");
    if (fp == NULL){
		
       fprintf(stderr ,"Error opening result file [%s] , ( %s )  & %s\n",resultFile,strerror(errno),res);
       
       mainReturn = -1;
       exit(1);
    }
    fprintf(fp,"%d$%s$%lf$%d$%s",resCode,res,cpuUsage,memUsage,whyError);
    fclose(fp);
    exit(0);
}



/*
 * 
 * 
 * */
void showUsage(){

#ifdef DEBUG
    fprintf(stderr ,"./safejudge <executable file> [options]");
    fprintf(stderr ,"options:\n");
    fprintf(stderr ,"-t <cpu limit> [default: 5s]\n");
    fprintf(stderr ,"-m <memory limit> [default: 256 mb]\n");
    fprintf(stderr ,"-i <stdin test case file>\n");
    fprintf(stderr ,"-o <stdout file>\n");
    fprintf(stderr ,"-e <stderr file>\n");
    fprintf(stderr ,"-r <result file>\n");
    fprintf(stderr ,"-c <chroot directory>\n");
    fprintf(stderr ,"-d <code run directory inside chroot>\n");
#endif

	writeResult(SYSTEM_ERROR,"error while parsing arguments with '?' case",0,0,"null");
}


/*
 *
 *
 * */
void parseArgs(int argc, char *argv[]){

	extern char *optarg;
	extern int optind;
	int isIn = 0, isOut = 0, isRes = 0 , isChroot = 0, c , tmpT, tmpM;

	while ((c = getopt(argc, argv, "p:i:o:e:r:t:m:c:d:n:")) != -1){
		switch (c) {
			case 'i':
				isIn = 1;
				inputFile = optarg;
				break;
			case 'o':
				isOut = 1;
				outputFile = optarg;
				break;
			case 'e':
				stderrFile = optarg;
				break;
			case 'r':
				isRes = 1;
				resultFile = optarg;
				break;
			case 'c':
				CHROOT_DIR = optarg;
				break;
			case 'd':
				RUN_DIR = optarg;
				break;
			case 't':
				tmpT = atoi(optarg);
				if( tmpT>15000 ){
					writeResult(SYSTEM_ERROR,"maximum cpu limit is 15 seconds (15000 ms)",0,0,"maximum cpu limit is 15 seconds");
				}
				else if( tmpT < 0 ){
					writeResult(SYSTEM_ERROR,"cpu limit can't be negative",0,0,"cpu limit can't be negative");
				}
				cpuLimit = tmpT;  //in millisecond
				break;
			case 'm':
				tmpM = atoi(optarg);
				if( tmpM>memoryLimit ){
					writeResult(SYSTEM_ERROR,"maximum memory limit is 256 mb",0,0,"maximum memory limit is 256 mb");
				}
				else if( tmpM <= 0 ){
					writeResult(SYSTEM_ERROR,"memory limit can't be zero or negative",0,0,"memory limit can't be zero or negative");
				}
				memoryLimit = tmpM;  //in MegaByte
				break;
			case '?':
				showUsage();
				return;
		}
	}


	if( !isIn )
		writeResult(SYSTEM_ERROR,"input file not specified",0,0,"null");
	else if( !isOut )
		writeResult(SYSTEM_ERROR,"output file not specified",0,0,"null");
	else if( !isRes )
		writeResult(SYSTEM_ERROR,"result file not specified",0,0,"null");
	if( argc < optind + 1 )
		writeResult(SYSTEM_ERROR,"executable file not specified",0,0,"null");
	if( argc > optind + 1 )
		writeResult(SYSTEM_ERROR,"too much arguments! only one is allowed (executable file)",0,0,"null");
	else
		programFile = argv[optind];
	
	
#ifdef DEBUG
    fprintf(stderr ,"argc: %d, optind: %d\n",argc,optind);
    fprintf(stderr ,"executableFile: %s\ninputfile: %s\noutputfile: %s\nresultFile: %s\ncpuLimit: %d MS\nmemoryLimit: %d MB\n",
								programFile,inputFile,outputFile,resultFile,cpuLimit,memoryLimit);
#endif

    int fd = open(inputFile, O_RDONLY);
    if( fd < 0 ){
        writeResult(SYSTEM_ERROR,"Problem opening input file",0,0,"null");
    }

    dup2(fd,0);
    close(fd);
}


/*
 * 
 * */
void managePermissions(){
    curUid = geteuid();
    curGid = getgid();

    struct passwd *nobody = getpwnam("nobody");

    if( nobody == NULL ){
        writeResult(SYSTEM_ERROR,"No user named nobody",0,0,"null");
    }

    childUid = nobody->pw_uid;
	childGid = nobody->pw_gid;

#ifdef DEBUG
    fprintf(stderr ,"User id loaded:: ");
    fprintf(stderr ,"User id: %d %d  && ",curUid,curGid);
    fprintf(stderr ,"Child id: %d %d\n",childUid,childGid);
#endif
 
}


/*
 * 
 * */
void alarmHandler(int signum){
	if(pid > 0) kill(pid, SIGKILL);

	writeResult(TLE,"TLE (Alarm)",MStoSecondDouble(cpuLimit),memoryUsed,"null");
}


/*
 * 
 * */
void setLimitDiff(int resource,int softLimit,int hardLimit){
    struct rlimit lim;
	lim.rlim_cur = softLimit;
	lim.rlim_max = hardLimit;
	if (setrlimit(resource, &lim) != 0){
        writeResult(SYSTEM_ERROR,"Set limit Diff Error",0,0,"null");
	}
}


/*
 * 
 * */
void setLimit(int resource,int limit){
    struct rlimit lim;
	lim.rlim_cur = lim.rlim_max = limit;
	if (setrlimit(resource, &lim) != 0){
        writeResult(SYSTEM_ERROR,"Set limit Error",0,0,"null");
	}
}


/*
 *
 *
 *  */
void setLimits(){

    setLimitDiff(RLIMIT_CPU,MStoSecond(cpuLimit), MStoSecond(cpuLimit)+2);

    setLimit(RLIMIT_AS, MBtoByte(memoryLimit+50));
    setLimit(RLIMIT_DATA, MBtoByte(memoryLimit));
    setLimit(RLIMIT_RSS, MBtoByte(memoryLimit));
    setLimit(RLIMIT_STACK, MBtoByte(memoryLimit));
   // setLimit(RLIMIT_MEMLOCK, MBtoByte(memoryLimit));
    setLimit(RLIMIT_FSIZE, MBtoByte(memoryLimit));

    setLimit(RLIMIT_NOFILE,4); //maximum file descriptor
    setLimit(RLIMIT_NPROC,2);
    setLimit(RLIMIT_CORE,0);
 
#ifdef DEBUG
    fprintf(stderr , "Done Resource Limit Set\n");
#endif
}


/*
 *
 *
 *  */
void setFileDescriptor(){

    int fd = open(outputFile, O_WRONLY);
    if( fd < 0 ){
		fprintf(stderr ,"Error opening output file (%s) , errno = %s\n",outputFile,strerror(errno));
        writeResult(SYSTEM_ERROR,"Problem opening output file",0,0,"null");
    }
    dup2(fd,1);
    close(fd);


	/*
    int fder = open(stderrFile, O_WRONLY);
    if( fder < 0 ){
        writeResult(SYSTEM_ERROR,"Problem opening stderr file",0,0,"null");
    }
    dup2(fder,STDERR_FILENO);
    close(fder);*/
}



/*
 *  (c) https://www.hackerearth.com/notes/vivekprakash/technical-diving-into-memory-used-by-a-program-in-online-judges/
 * */
int get_memory_usage() {
    int fd, data, stack,VmSize = 0,VmRSS = 0;
    char buf[4096], status_child[30];
    char *vm;

    sprintf(status_child, "/proc/%d/status", pid);
    if ((fd = open(status_child, O_RDONLY)) < 0)
        return -1;

    int y = read(fd, buf, 4095);
    buf[4095] = '\0';
    close(fd);

    data = stack = 0;

    vm = strstr(buf, "VmData:");
    if (vm) {
        sscanf(vm, "%*s %d", &data);
    }
    vm = strstr(buf, "VmStk:");
    if (vm) {
        sscanf(vm, "%*s %d", &stack);
    }

    return data + stack;
}


/*
 *
 *
 *  */
void handleChild(){

    if( chdir(CHROOT_DIR) != 0 ){
		fprintf(stderr ,"chdir error:  %s\n",strerror(errno));
        writeResult(SYSTEM_ERROR,"Error chdir.",0,0,"null");
    }

    if( chroot(".") != 0 ){
		fprintf(stderr ,"chroot error:  %s\n",strerror(errno));
        writeResult(SYSTEM_ERROR,"Error chroot.",0,0,"null");
    }

    setFileDescriptor();
    setLimits();

    if( setgid(childGid) || setuid(childUid)  ){
		fprintf(stderr ,"Error setting uid/gid:  %s\n",strerror(errno));
        writeResult(SYSTEM_ERROR,"Error setting uid/gid.",0,0,"null");
    }

    if(getuid() == 0){
		fprintf(stderr ,"Running as root not secure:\n");
        writeResult(SYSTEM_ERROR,"Running as root not secure",0,0,"null");
    }

    		// trace me
    if(ptrace(PTRACE_TRACEME,0,NULL,NULL) < 0){
        writeResult(SYSTEM_ERROR,"ptrace traceme failed! check if it is already been traced by other proc",0,0,"null");
    }


    char FielPRog[100];
    strcpy(FielPRog,RUN_DIR);
    strcat(FielPRog,programFile);

#ifdef DEBUG
    fprintf(stderr,"Executing file %s, under user id: %d , errno = %s\n",FielPRog,getuid(),strerror(errno));
#endif


    //execl(FielPRog, FielPRog, NULL);
    char *const params[] = {FielPRog, NULL};
    execve(FielPRog,params,NULL);


	fprintf(stderr ,"execve error occured! reason:  %s\n",strerror(errno));

    writeResult(SYSTEM_ERROR,"execve error occured!",0,0,"null");
}



/*
 *
 *
 *  */
void handleTrap(pid_t pid){
	
    int orig_eax = ptrace(PTRACE_PEEKUSER,pid, 8*ORIG_RAX, NULL);

    if( orig_eax == -1 )
        writeResult(SYSTEM_ERROR,"Error peeking user",0,0,"null");

#ifdef DEBUG
    fprintf(stderr ,"Calling   %-16s\t(id:%4d)\t\n", syscall_list[orig_eax], orig_eax);
#endif


	/* 
	 * TODO: Please check all of these white listing carefully!
	 *
	 * */
    if( allowed_syscall[orig_eax] == -1  ) return;


    callCount[orig_eax]++;

    if( callCount[orig_eax]>allowed_syscall[orig_eax] ){
        ptrace(PTRACE_KILL, pid, NULL, NULL);

#ifdef DEBUG
        fprintf(stderr ,"%s not allowed!\n", syscall_list[orig_eax]);
#endif

        char frbdnErr[] = "RE (Forbidden System Call [";
		strcat(frbdnErr,syscall_list[orig_eax]);
		strcat(frbdnErr,"])");
        writeResult(RE, frbdnErr,0,memoryUsed,frbdnErr);
    }
}


/*
 *
 *
 *  */
void handleParent(){


	int status;
    struct user_regs_struct regs;
    struct rusage rused;
    memoryUsed  = 0;

    signal(SIGALRM, alarmHandler);
    alarm(MStoSecond(cpuLimit) + 1);

    while(1){

        wait4(pid, &status, 0, &rused);

        int timenow = (int) ( (rused.ru_utime.tv_sec * 1000 + rused.ru_utime.tv_usec / 1000) + (rused.ru_stime.tv_sec * 1000 + rused.ru_stime.tv_usec / 1000) ); //in miliseconds

        if( timenow > cpuLimit ){
            writeResult(TLE,"TLE (Rused) [timenow > cpuLimit]",MStoSecondDouble(cpuLimit),memoryUsed,"null");
        }

        if(WIFEXITED(status)) {
            if(WEXITSTATUS(status) != 0) {

#ifdef DEBUG
			fprintf(stderr ,"WIFEXITED with status %d || %s\n",WEXITSTATUS(status),strerror(errno));
#endif

                writeResult(RE,"WIFEXITED",MStoSecondDouble(timenow),memoryUsed,"WIFEXITED");
            }else {
                writeResult(OK,"OK!",MStoSecondDouble(timenow),memoryUsed,"null");
            }
        }

        if (WIFSIGNALED(status)){
			
			int signum = WTERMSIG(status);

#ifdef DEBUG
			fprintf(stderr ,"WIFSIGNALED with signal %s\n",signal_list[signum]);
#endif

            writeResult(RE,"WIFSIGNALED",MStoSecondDouble(timenow),memoryUsed,"WIFSIGNALED");
        }


        memoryUsed = get_memory_usage();

#ifdef DEBUG
        fprintf(stderr ,  "memoryUsed = %d , limit = %d\n" ,memoryUsed,MBtoKB(memoryLimit));
#endif

        if( memoryUsed >= MBtoKB(memoryLimit) ){
            writeResult(MLE,"Memory Limit Exceeded (rused)",MStoSecondDouble(timenow),memoryUsed,"null");
        }


        if(WIFSTOPPED(status)){
            int sig = WSTOPSIG(status);

#ifdef DEBUG
            if(sig!=SIGTRAP)
				fprintf(stderr ,"WIFSTOPPED with signal %s\n",signal_list[sig]);
#endif

            switch (sig){
                case SIGUSR1:
                    writeResult(RE,"(SIGUSR1)!",MStoSecondDouble(timenow),memoryUsed,"SIGUSR1");
                    break;
                case SIGTRAP:
                    handleTrap(pid);
                    break;
                case SIGXFSZ:
                    writeResult(OLE,"OLE (SIGXFSZ)",MStoSecondDouble(timenow),memoryUsed,"Output Limit Exceeded (SIGXFSZ)");
                    break;
                case SIGSEGV:
                    writeResult(RE,"Segmentation Fault (SIGSEGV)",MStoSecondDouble(timenow),memoryUsed,"Segmentation Fault (SIGSEGV)");
                    break;
                case SIGFPE:
                    writeResult(RE,"Floating Point (SIGFPE)",MStoSecondDouble(timenow),memoryUsed,"Floating Point Exception (SIGFPE)");
                    break;
                case SIGALRM:
                    writeResult(TLE,"TLE (SIGALRM)",MStoSecondDouble(cpuLimit),memoryUsed,"null");
                    break;
                case SIGXCPU:
                    writeResult(TLE,"TLE (SIGXCPU)",MStoSecondDouble(cpuLimit),memoryUsed,"null");
                    break;
                case SIGABRT:
                    writeResult(RE,"RE (SIGABRT)",MStoSecondDouble(timenow),memoryUsed,"Fatal Error (SIGABRT)");
                    break;
                default:
                    writeResult(RE,"WITH CODE (WIFSTOPPED)(default)",MStoSecondDouble(timenow),memoryUsed,"WIFSTOPPED");
                    break;
            }
        }


        if(ptrace(PTRACE_SYSCALL, pid, NULL, NULL)==-1)
            writeResult(SYSTEM_ERROR,"Error PTRACE_SYSCALL child",0,0,"null");
    }

}


int main(int argc, char *argv[]){

    parseArgs(argc,argv); 
    
    managePermissions();  

    pid = fork();
    //fprintf(stderr ,"fork with pid:  %d, status(errno): %s\n",pid,strerror(errno));
    switch(pid){
       case -1:
          writeResult(SYSTEM_ERROR,"FORK ERROR",0,0,"null");
          fprintf(stderr ,"FORK error! reason:  %s\n",strerror(errno));
          break;
       case 0:
          handleChild();
          break;
       default :
          handleParent();
    }

    return mainReturn;
}
