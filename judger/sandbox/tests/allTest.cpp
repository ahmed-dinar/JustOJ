#include<bits/stdc++.h>

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


using namespace std;

#define FI           freopen("in.txt","r",stdin)
#define FO           freopen("out.txt","w",stdout)

//sudo g++ -Wno-write-strings -W -O2 code.cpp -o /SECURITY/JAIL/home/run/code
//Codemarshal flags
//C => gcc -Wall -O2 -static source.c -lm
//C++ => g++ -Wall -O2 -static -std=c++11 source.cpp

//OJ's
//g++ -w -O2 -fomit-frame-pointer -lm -o  /var/SECURITY/JAIL/home/runs/code allTest.cpp

// sudo ./sand code ../in.txt /home/runs/out.txt /home/runs/err.txt /var/SECURITY/JAIL/home/runs/result.txt 1500 32
// sudo ./safejudge code -i in.txt -o /home/runs/out.txt -e /home/runs/err.txt -r /var/SECURITY/JAIL/home/runs/result.txt -t 1500 -m 32
 




void doSegmentFault(){
    *(int*)0=0;
}

void doFloatingPointException(){
    int a=0;
    int b=1;
    cout << b/a << endl;
}

void doTimeLimit(){
    while(1){}
}

void normal(int n){
	printf("YES! %d\n",n);
}

void doFork(){
	pid_t child;
    child = fork();
    if(child > 0) kill(child, SIGKILL); 
}


void doOpenFile(){
	string fname = "oh.txt";
	FILE *fp = fopen(fname.c_str(), "w");
	if(fp!=NULL) fclose(fp);
}

void LOOPS(){
	    long long k = 1;
    for(int i=0; i<10000000; i++){


        for(int j=0; j<10000000; j++){
            for(int pp=0; pp<10000000; pp++){
                k++;
            }
        }


        //cout << "hi " << k << endl;
    }

}


void doAlarmTLE(){
	int n;
	while( scanf("%d",&n)  ){
		printf("%d\n",n);
	}
}

void doSIGABRT(){
	  double *arr,*arr2,*arr3;
    arr=new double[100000000];
    arr2=new double[100000000];
    arr3=new double[100000000];
}



void doMLE(){
		  char *p;
  int k;
  int cnt;

  cnt = 0;
  for (;;)
    {
      p = (char *) malloc (1024);
      for (k = 0; k < 1024; k ++)
        p [k] = rand () % 256;
      cnt++;
      printf("%d kb %d mb allocated\n", cnt, cnt/1024);
    }
}


void doOLE()
{
	int t,T=0;
	scanf("%d",&t);
	while(t--){
		int a,b;
		scanf("%d %d",&a,&b);
		
		int I,J,K;
		int arrr[100000];
		for(I=0; I<1000; I++){
			for(J=0; J<1000; J++){
				printf("%d",I);
			}
		}

		printf("Casae %d: %d\n",++T,a+b);
	}
}

int main(){
	

	//LOOPS();


   // cout << "hi final on "  << endl;
	//doSIGABRT();
	//doMLE();

	//int n;
	//scanf("%d",&n);
	//normal(n);

   // doSegmentFault();
 //   doFloatingPointException();
    doTimeLimit();
  // doAlarmTLE();
  // doFork();
   //FI;
  //  doOpenFile();
  // uid_t curUid = geteuid();
	
	


    cout << "hi final aaaa "  << endl;

    return 0;
}
