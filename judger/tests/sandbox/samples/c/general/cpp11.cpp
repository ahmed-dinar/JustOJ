#include<bits/stdc++.h>
#include <tuple>

using namespace std;

//http://thispointer.com/c11-stdtuple-tutorial-examples/

/*
 * Returning multiple values from a function by binding them in a single
 * tuple object.
 */
tuple<int, double, string> someFunction()
{
  // Creating a tuple of int, double and string
  tuple<int, double, string> result(7, 9.8, "text");

  // Returning tuple object
  return result;
}


int main()
{

  // Get tuple object from a function
  tuple<int, double, string> result = someFunction();

  // Get values from tuple

  // Get First int value from tuple
  int iVal = get < 0 > (result);

  // Get second double value from tuple
  double dVal = get < 1 > (result);

  // Get third string value from tuple
  string strVal = get < 2 > (result);

  // Print values
  cout << "int value = " << iVal << endl;
  cout << "double value = " << dVal << endl;
  cout << "string value = " << strVal << endl;

  return 0;
}