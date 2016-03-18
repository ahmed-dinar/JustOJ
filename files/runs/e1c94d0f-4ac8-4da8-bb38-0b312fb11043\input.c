/*
Ahmed Dinar
CSE,JUST
*/

#include<stdio.h>
#include<stdlib.h>
#include<string.h>
int main()
{
    long long add[10000],i,j,k,ln,la,lb,ad,cr,l;
    char a[100],b[100];
    int tt = scanf("%s",a);
    int rr = scanf("%s",b);
    la = strlen(a);
    lb = strlen(b);
    ln = la;
    if( la < lb)
    {
        ln = lb;
    }
    i = la-1;
    j = lb-1;
    k = 0;
    cr = 0;
    l = 0;
    while(ln--)
    {
        if( i < 0 )
        {
            ad = (b[j]-48) + cr;
        }
        else if( j < 0)
        {
            ad = (a[i]-48) + cr;
        }
        else
        {
            ad = (a[i]-48) + (b[j]-48) + cr;
        }

        if( ln == 0)
        {
            if(ad<10)
            {
                add[l] = ad;
            }
            else
            {
                add[l] = ad%10;
                l++;
                add[l] = ad/10;
            }
        }
        else
        {
            if(ad<10)
            {
                add[l] = ad;
                cr = 0;
            }
            else
            {
                add[l] = ad%10;
                cr = ad/10;
            }
        }
        i--;
        j--;
        l++;
    }
    for( i = l-1; i>=0; i--)
    {
        printf("%lld",add[i]);
    }
    return 0;
}
