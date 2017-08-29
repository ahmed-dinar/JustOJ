#include<bits/stdc++.h>

using namespace std;

int main(){
	
	string fname = "oh.txt";
	FILE *fp = fopen(fname.c_str(), "w");
	if(fp!=NULL) fclose(fp);
    return 0;
}

