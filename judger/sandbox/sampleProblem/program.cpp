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
#define FO           freopen("out2.txt","w",stdout)

//sudo g++ -Wno-write-strings -W -O2 code.cpp -o /SECURITY/JAIL/home/run/code
//Codemarshal flags
//C => gcc -Wall -O2 -static source.c -lm
//C++ => g++ -Wall -O2 -static -std=c++11 source.cpp

//OJ's
//gcc -Wall -Wno-unused-result -O2 -fomit-frame-pointer -lm -o /VAR/SECURITY/JAIL/home/runs/code code.c
//g++ -w -O2 -fomit-frame-pointer -lm -o  /SECURITY/JAIL/home/run/code code.cpp

// sudo ./sand code ../in.txt /home/runs/out.txt /home/runs/err.txt /var/SECURITY/JAIL/home/runs/result.txt 1500 32
// sudo ./safejudge code -i ../sampleProblem/input.txt -o /home/runs/out.txt -e /home/runs/err.txt -r /var/SECURITY/JAIL/home/runs/result.txt -m 1500 -t 32
 

#define FI           freopen("in.txt","r",stdin)
#define FO           freopen("out.txt","w",stdout)


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



int main(){
	

//FI;
//FO;
	
	doMLE();

	//int n;
	//scanf("%d",&n);
	//normal(n);

   // doSegmentFault();
   // doFloatingPointException();
   // doTimeLimit();
  // doAlarmTLE();
  // doFork();
   //FI;
  //  doOpenFile();
  // uid_t curUid = geteuid();
	


	int t,T=0;
	cin>>t;
		
	while(t--){
		
		int a,b;
		cin>>a>>b;
		cout << "Casae " << ++T << ": " << a+b << endl;
		
		/*int k,m;
		for (k = 0; k < 100; k ++){
			for (m = 0; m < 1; m ++){
				cout << "hi"<<endl;
			}
		}*/
	}

    return 0;
}

