


import java.util.*;
import java.io.*;
import javax.script.*;
import java.net.*;

public class OutOfIndex {

  public static void main(String[] args){
    Scanner sc = new Scanner(System.in);

   outIndex();

    int n = sc.nextInt();
    for(int i=1; i<=n; i++){
      int a = sc.nextInt();
      int b = sc.nextInt();
      System.out.println("Case " + i + ": " + (a+b));
    }

  }

  public static void outIndex(){
    int[] ar = new int[2];
    ar[10] = 5;
  }
}