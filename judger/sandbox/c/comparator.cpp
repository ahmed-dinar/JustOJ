/*
 *
 * Author: Ahmed Dinar
 * Last Modified: 21 Aug,2017
 *
 *
 * TO COMPILE:  g++ -O2 -lm -o /home/ahmed-dinar/JustOJ/judger/sandbox/comparator comparator.cpp
 * 
 * sudo cp -i safejudge /home/ahmed-dinar/JustOJ/helpers/compiler/sandbox
 *
 */
 
#include <iostream>
#include <cstdio>
#include <cstdlib>
#include <string>

using namespace std;
 
#define SYSTEM_ERROR -1
#define ACCEPTED 0
#define WRONG_ANSWER 9

int main(int argc, char *argv[]){

    if( argc < 3 ) {
		fprintf(stderr, "%s\n", "both output file required");
		exit(1);
	}
	
	string judgeFile = (string) argv[1];
	string programFile = (string) argv[2];
	FILE *programOut, *judgeOut;
	
	programOut = fopen(programFile.c_str(), "r");
	judgeOut = fopen(judgeFile.c_str(), "r");

	if (programOut == NULL){
		fprintf(stdout, "%d", SYSTEM_ERROR);
		fprintf(stderr, "No such file or directory %s", programFile.c_str());
		exit(1);
	}

	if (judgeOut == NULL){
		fprintf(stdout, "%d", SYSTEM_ERROR);
		fprintf(stderr, "No such file or directory %s", judgeFile.c_str());
		exit(1);
	}
	
	int eofProgram, eofJudge, lineNum = 0;
	char charProgram, charJudge;
	
	while (1) {
      while ((eofProgram = fscanf(programOut, "%c", &charProgram)) != EOF  ){
		  if( charProgram == '\n' )
			lineNum++;
			
		if( charProgram != '\r'  ){
			break;
		}
		
	  }
      
      while ((eofJudge = fscanf(judgeOut, "%c", &charJudge)) != EOF ){
		if( charJudge != '\r'  ) break;
	  }
      
      if (eofProgram == EOF || eofJudge == EOF) break;
      
      if (charProgram != charJudge) {
		break;
      }
    }
   
   
    if (charProgram != charJudge) {
		fprintf(stdout, "%d\n", WRONG_ANSWER);
        fprintf(stderr, "Expected %c, found %c at line %d\n",  charJudge, charProgram, lineNum + 1);
        fclose(programOut);
    fclose(judgeOut);
		exit(0);
    }
    
    while ((eofProgram = fscanf(programOut, "%c", &charProgram)) != EOF  ){
		  if( charProgram == '\n' )
			lineNum++;
			
		if( charProgram != '\r' && charProgram != '\n' ){
			break;
		}
		
	  }
	  
	  while ((eofJudge = fscanf(judgeOut, "%c", &charJudge)) != EOF ){
		if( charJudge != '\r' && charJudge != '\n' ) break;
	  }
	  
	          fclose(programOut);
    fclose(judgeOut);
	  
	  
	  if (charProgram != charJudge) {
		fprintf(stdout, "%d\n", WRONG_ANSWER);
        fprintf(stderr, "Expected %c, found %c at line %d\n",  charJudge, charProgram, lineNum + 1);

		exit(0);
    }
    
    
      
	fprintf(stdout, "%d\n", ACCEPTED);
	exit(0);
}


