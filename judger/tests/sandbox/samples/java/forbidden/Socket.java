import java.util.*;
import java.io.*;
import javax.script.*;
import java.net.*;

public class Socket {

  public static void main(String[] args){
    Scanner sc = new Scanner(System.in);

    makeSocket();

    int n = sc.nextInt();
    for(int i=1; i<=n; i++){
      int a = sc.nextInt();
      int b = sc.nextInt();
      System.out.println("Case " + i + ": " + (a+b));
    }
  }


  public static void makeSocket(){
    try {
      ServerSocket listener = new ServerSocket(9090);
    }
    catch(IOException oo) {
    }
  }

}