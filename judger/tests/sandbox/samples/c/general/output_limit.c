#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <string.h>

int main(){

  int t,T=0;
  scanf("%d",&t);
  while(t--){
    int a,b;
    scanf("%d %d",&a,&b);

    int I,J,K;
    int arrr[100000];
    arrr[0] = 1;
    printf("%d\n", arrr[0]);
    for(I=0; I<1000; I++){
      for(J=0; J<1000; J++){
      for(K=0; K<1000; K++){
        printf("%d",I);
      }
      }
    }

    printf("Casae %d: %d\n",++T,a+b);
  }

  return 0;
}
