/***********************TUFAAN***********************/
#include<bits/stdc++.h>
#define pi acos(-1.0)
#define pb push_back
#define LL long long
#define LIM 5000007
using namespace std;
double _D(){double x; scanf("%lf",&x); return x;}
int _I(){int x; scanf("%d",&x); return x;}
LL _L(){LL x; scanf("%lld",&x); return x;}
LL gcd(LL x,LL y){if(x%y==0) return y; else return gcd(y,x%y);}
LL lcm(LL x,LL y){x/=gcd(x,y); return x*y;}
int cases;
//int kdx[8]={-2,-2,-1,-1,1,1,2,2};
//int kdy[8]={-1,1,-2,2,-2,2,-1,1};
 
bool prime[LIM+2];
int phii[LIM+2];
bool chk[LIM+2];
LL dp[LIM+2];
LL x;
int a,b,i;
void sieve(){
        int i,j; prime[1]=1;
        for(i = 2; i <= LIM; i++){
                if(!prime[i]){
                        phii[i] = i-1;
                        for(j = i+i; j <= LIM; j += i){
                                prime[j] = 1;
                                if(chk[j]){
                                        phii[j] /= i;
                                        phii[j] *= (i-1);
                                }
                                else {
                                        chk[j] = 1;
                                        phii[j] = j/i;
                                        phii[j] *= (i-1);
                                }
                        }
 
                }
 
        }
}
void game(){
        dp[2] = 1;
        for(i = 3; i < LIM; i++){
                x = phii[i];
                x = x*x;
                dp[i] = dp[i-1] + x;
        }
}
void lipu_mira(){
        scanf("%d %d",&a,&b);
        printf("Case %d: ",++cases);
        printf("%lld\n",dp[b]-dp[a-1]);
}
int main()
{
    ///freopen("input.txt", "r", stdin);
    ///freopen("output.txt", "w", stdout);
    sieve();
    game();
    int t = _I();
    while(t--) lipu_mira();
    return 0;
}
 
