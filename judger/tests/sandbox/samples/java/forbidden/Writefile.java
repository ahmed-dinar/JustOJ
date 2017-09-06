import java.util.*;
import java.io.*;
import javax.script.*;
import java.net.*;

public class Writefile {

  public static void main(String[] args){
    Scanner sc = new Scanner(System.in);

    writeAFile();

    int n = sc.nextInt();
    for(int i=1; i<=n; i++){
      int a = sc.nextInt();
      int b = sc.nextInt();
      System.out.println("Case " + i + ": " + (a+b));
    }
  }


  public static void writeAFile(){
    BufferedWriter out = null;
    try  {
      FileWriter fstream = new FileWriter("out.txt", true); //true tells to append data.
      out = new BufferedWriter(fstream);
      out.write("\nsue");
    }
    catch (IOException e){
      System.err.println("Error: " + e.getMessage());
    }
    finally{
      try {
        if (out != null)
          out.close();
      } catch (IOException ex) {
        ex.printStackTrace();
      }
    }
  }

}