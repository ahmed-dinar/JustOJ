#include <stdio.h>
#include <stdlib.h>

#include <netinet/in.h>
#include <sys/socket.h>
#include <sys/ptrace.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>
#include <sys/user.h>
#include <sys/reg.h>
#include <fcntl.h>
#include <pwd.h>
#include <sys/resource.h>
#include <errno.h>
#include <dirent.h>


void doFloatingPointException(){
    int a=0;
    int b=1;
    printf("%d",b/a);
}

void doSegmentFault(){
    *(int*)0=0;
}

void doTimeLimit(){
    while(1){}
}

void doOpenFile(){
	FILE *fp = fopen("oh.txt", "w");
	int result = access ("oh.txt", F_OK);
	printf("access ? %d\n",result);
	if(fp!=NULL){
		printf("oh.txt opened!");
		fclose(fp);
	}else{
		printf("oh.txt opened!");
	}
}

void doFork(){
	pid_t child;
    child = fork();
    if(child > 0) kill(child, SIGKILL); 
}

void curcwd(){
	 char cwd[1024];
	if (getcwd(cwd, sizeof(cwd)) != NULL)
       printf("Current working dir: %s\n", cwd);
   else
       printf("getcwd() error");
}


int main(){
	
	//curcwd();
	//..doTimeLimit();
	//doFloatingPointException();
	//doSegmentFault();
	//doOpenFile();
	doFork();

	//const char *filename = "/tmp/myfile";


	//sys_access
	//int result = access (filename, F_OK);
	//printf("%d\n",result);
	
	
	//sys_write
	//if (write(1, "This will be output to standard out\n", 36) != 36) {
   //     write(2, "There was an error writing to standard out\n", 44);
   //     return -1;
   // }
 
	

	int t,T=0;
	scanf("%d",&t);

if(t>40){
	//doFloatingPointException();
}

	while(t--){
		int a,b;
		scanf("%d %d",&a,&b);
		
	


		printf("case %d: %d\n",++T,a+b);
	}
	return 0;	
}
