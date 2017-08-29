#include<bits/stdc++.h>

using namespace std;

int main(){
	
  char *p;
  int k;
  int cnt = 0;

  for (;;)
    {
      p = (char *) malloc (1024);
      for (k = 0; k < 1024; k ++)
        p [k] = rand () % 256;
      cnt++;
      printf("%d kb %d mb allocated\n", cnt, cnt/1024);
    }

    return 0;
}

