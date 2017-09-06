import java.util.*;
import java.io.*;
import javax.script.*;
import java.net.*;

public class Fork {

  public static void main(String[] args){
    Scanner sc = new Scanner(System.in);

    processFork();

    int n = sc.nextInt();
    for(int i=1; i<=n; i++){
      int a = sc.nextInt();
      int b = sc.nextInt();
      System.out.println("Case " + i + ": " + (a+b));
    }
  }


  public static void processFork(){
    Runtime runtime = Runtime.getRuntime();
    try {
      Process p1 = runtime.exec("mkdir hack");
    }catch (Exception e) {
      e.printStackTrace();
    }
  }

}