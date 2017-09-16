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
    printf("Case %d: %d\n",++T,a+b);
  }
  return 0;
}
