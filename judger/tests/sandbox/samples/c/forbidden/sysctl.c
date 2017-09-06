#include <stdio.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <unistd.h>
#include <netinet/in.h>
#include <fcntl.h>
#include <pwd.h>
#include <errno.h>
#include <dirent.h>
#include <grp.h>

#include <sys/wait.h>
#include <sys/user.h>
#include <sys/time.h>
#include <sys/reg.h>
#include <sys/socket.h>
#include <sys/ptrace.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <sys/user.h>
#include <sys/reg.h>
#include <sys/resource.h>
#include <sys/stat.h>
#include <sys/mount.h>
#include <sys/sysctl.h>



int main(){

  int name[] = {2, 3};
  int namelen = 2;
  int oldval[8];
  size_t len = sizeof(oldval);

  sysctl (name, namelen, (void *)oldval, &len, NULL , 0 );

  return 0;
}