


import java.util.*;
import java.io.*;
import javax.script.*;
import java.net.*;

public class FloatingPoint {

  public static void main(String[] args){
    Scanner sc = new Scanner(System.in);

    floatingPoint();

    int n = sc.nextInt();
    for(int i=1; i<=n; i++){
      int a = sc.nextInt();
      int b = sc.nextInt();
      System.out.println("Case " + i + ": " + (a+b));
    }
  }

  public static void floatingPoint(){
    int a = 1;
    int b = 0;
    int c = a/b;
  }
}