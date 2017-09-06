#include <stdio.h>
#include <stdlib.h>

#include <netinet/in.h>
#include <sys/socket.h>
#include <sys/ptrace.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>
#include <sys/user.h>
#include <sys/reg.h>
#include <fcntl.h>
#include <pwd.h>
#include <sys/resource.h>
#include <errno.h>
#include <dirent.h>

int main(){

   uid_t uid = 1000;
   setuid(uid);

  return 0;
}