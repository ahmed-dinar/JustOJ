#include<cstdio>
#include<sstream>
#include<cstdlib>
#include<cctype>
#include<cmath>
#include<algorithm>
#include<set>
#include<queue>
#include<deque>
#include<stack>
#include<list>
#include<iostream>
#include<fstream>
#include<numeric>
#include<string>
#include<vector>
#include<cstring>
#include<map>
#include<iterator>
#include<limits>

using namespace std;

#define FI           freopen("in","r",stdin)
#define FO           freopen("out","w",stdout)

#define i64          long long
#define oo           100000000000000LL
#define MAX          100005

int a[MAX];
int p[MAX];

int main(){

    FI;
   // FO;

    int t,n;
    scanf("%d",&t);
    while(t--){
        scanf("%d",&n);
        for(int i=0; i<n; i++) scanf("%d",&a[i]),p[i]=0;

        for(int i=0; i<n; ){
            int j = i+1, tot = 1;
            while( j+1<n && tot < 4 ){
                if( a[j] == a[j+1] ){
                    ans += 4-tot;
                    i = j+1;
                    break;
                }else if( a[j] > a[j+1] ){
                    if( 4-tot < a[j+1]-a[j] ){
                        ans+=4-tot;
                        i = j+1;
                        break;
                    }
                    else{
                        tot++;
                        j = j+1;
                    }
                }
            }
        }

        cout << tot << endl;

    }

    return 0;
}

