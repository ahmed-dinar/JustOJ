#include<stdio.h>
#include<stdlib.h>

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
	if(fp!=NULL) fclose(fp);
}

void doFork(){
	pid_t child;
    child = fork();
    if(child > 0) kill(child, SIGKILL); 
}



int main(){

	//doTimeLimit();
	//doFloatingPointException();
	//doSegmentFault();
	//doOpenFile();
	//doFork();

	

	int t,T=0;
	scanf("%d",&t);

if(t>40){
	//doFloatingPointException();
}

	while(t--){
		int a,b;
		scanf("%d %d",&a,&b);
		
	


		printf("Casae %d: %d\n",++T,a+b);
	}
	return 0;	
}
