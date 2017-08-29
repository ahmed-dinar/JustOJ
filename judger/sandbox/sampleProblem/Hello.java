// (c) Ahmed Dinar, 2017
//
//sudo ./safejudge Hello -i ../sampleProblem/input.txt -o /home/runs/out.txt -e /home/runs/err.txt -r /var/SECURITY/JAIL/home/runs/result.txt -m 500 -t 32
//https://stackoverflow.com/questions/4339611/exploitable-java-functions

import java.util.*;
import java.io.*;
import javax.script.*;
import java.net.*;

public class Hello {
	
	public static void main(String[] args)
	{
	  Scanner sc = new Scanner(System.in);
	  
	//  outOfMRE();
	  //hugeMemory();
		//readAFile();
		//writeAFile();
		//processFork();
		//listDir();
		//aFReader();
		//randomAc();
		//scriptMe();
		//floatingPoint();
		//outIndex();
		//socketMe();

	  int n = sc.nextInt();
	  for(int i=1; i<=n; i++){
		int a = sc.nextInt();
		int b = sc.nextInt();
		System.out.println("Case " + i + ": " + (a+b));
	  }
	}
	
	
	//http://cs.lmu.edu/~ray/notes/javanetexamples/
	public static void socketMe(){

        try {
			 ServerSocket listener = new ServerSocket(9090);
            while (true) {
                Socket socket = listener.accept();
                try {
                    PrintWriter out =
                        new PrintWriter(socket.getOutputStream(), true);
                    out.println(new Date().toString());
                } 
                catch (IOException ex) {ex.printStackTrace();}
                finally {
					try {
                    socket.close();
                    } 
                catch (IOException ex) {ex.printStackTrace();}
                }
            }
        }
        catch (IOException ex) {ex.printStackTrace();}

	}
	
	public static void outIndex(){
		int[] ar = new int[2];
		ar[10] = 5;
	}
	
	public static void floatingPoint(){
		int a = 1;
		int b = 0;
		int c = a/b;
	}
	
	//http://www.java2s.com/Tutorials/Java/Scripting_in_Java/0040__Scripting_in_Java_eval.htm
	public static void scriptMe() {
		try {
		ScriptEngineManager manager = new ScriptEngineManager();
		ScriptEngine engine = manager.getEngineByName("JavaScript");

		Object result = null;
		result = engine.eval("1 + 2;");
		System.out.println(result);
		}
		catch (ScriptException ex) {ex.printStackTrace();}
	}
	
	public static void randomAc(){
		try {
		RandomAccessFile raf = new RandomAccessFile("test.txt", "rw");
		raf.writeUTF("Hello World");
		raf.seek(0);
		System.out.println("" + raf.readLine());
		}
		catch (IOException ex) {ex.printStackTrace();}
	}
	
	public static void aFReader(){
				try {  
         FileReader fr=new FileReader("D:\\testout.txt");    
          int j;    
          while((j=fr.read())!=-1)    
          System.out.print((char)j);    
          fr.close();
          } catch(Exception e) {e.printStackTrace();}   
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
	
	public static void processFork(){
		Runtime runtime = Runtime.getRuntime();  
			try {
			Process p1 = runtime.exec("mkdir hack");
		}catch (Exception e) {
			e.printStackTrace();
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
	
	
	@SuppressWarnings("unchecked")
	public static void hugeMemory(){
		Vector v = new Vector();
		while (true)
		{
		  byte b[] = new byte[1048576];
		  v.add(b);
		  Runtime rt = Runtime.getRuntime();
		  System.out.println( "free memory: " + rt.freeMemory() );
		}
	}
	
	public static void outOfMRE(){
		int[] array = new int[200 * 1000 * 1000];
	}
	
	public static void someMemory(){
		int[] array= new int[9000];
		Random random = new Random();
		for (int i =0; i< array.length; i++){
			 array[i] = random.nextInt(9000)+1;
		}
	}
}
