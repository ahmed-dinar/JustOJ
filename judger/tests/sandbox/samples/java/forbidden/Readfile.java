import java.util.*;
import java.io.*;
import javax.script.*;
import java.net.*;

public class Readfile {

  public static void main(String[] args){
    Scanner sc = new Scanner(System.in);

    readAFile();

    int n = sc.nextInt();
    for(int i=1; i<=n; i++){
      int a = sc.nextInt();
      int b = sc.nextInt();
      System.out.println("Case " + i + ": " + (a+b));
    }
  }


  public static void readAFile(){
    File file = new File("file.txt");
    FileInputStream fis = null;

    try {
      fis = new FileInputStream(file);

      System.out.println("Total file size to read (in bytes) : "
          + fis.available());

      int content;
      while ((content = fis.read()) != -1) {
        // convert to char and display it
        System.out.print((char) content);
      }

    } catch (IOException e) {
      e.printStackTrace();
    } finally {
      try {
        if (fis != null)
          fis.close();
      } catch (IOException ex) {
        ex.printStackTrace();
      }
    }
  }

}