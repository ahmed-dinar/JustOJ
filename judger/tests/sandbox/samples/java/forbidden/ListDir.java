import java.util.*;
import java.io.*;
import javax.script.*;
import java.net.*;

public class ListDir {

  public static void main(String[] args){
    Scanner sc = new Scanner(System.in);

    listDir();

    int n = sc.nextInt();
    for(int i=1; i<=n; i++){
      int a = sc.nextInt();
      int b = sc.nextInt();
      System.out.println("Case " + i + ": " + (a+b));
    }
  }


  public static void listDir(){
    File f = null;
    File[] paths;
    try {
     f = new File("/");
     paths = f.listFiles();
     for(File path:paths) {
      System.out.println(path);
    }
  } catch(Exception e) {
   e.printStackTrace();
 }
}

}