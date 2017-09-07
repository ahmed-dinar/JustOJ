
import java.util.*;
import java.io.*;
import javax.script.*;
import java.net.*;

public class SystemProperty {

  public static void main(String[] args){
    Scanner sc = new Scanner(System.in);

    makeSystemProperty();

    int n = sc.nextInt();
    for(int i=1; i<=n; i++){
      int a = sc.nextInt();
      int b = sc.nextInt();
      System.out.println("Case " + i + ": " + (a+b));
    }
  }


  public static void makeSystemProperty(){
    System.setProperty("cat.mew", "mewee");
  }

}