#include<stdio.h>
#include<stdlib.h>

#include "myutil.h"

int MBtoByte(int mb){
    return (mb*1048576);
}

int KBtoByte(int kb){
    return (kb*1024);
}

int MBtoKB(int mb){
    return (mb*1024);
}

int KBtoMB(int kb){
    return (int)(kb/1024);
}

int MStoSecond(int timeLimit){
    return (int) (timeLimit + 1000) / 1000;
}

double MStoSecondDouble(int timeLimit){
    return (double)(((double)timeLimit)/1000.0);
}


