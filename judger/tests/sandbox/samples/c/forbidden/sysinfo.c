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
#include <sys/sysinfo.h>

int main(){

  struct sysinfo sys_info;

  if(sysinfo(&sys_info) != 0)
    perror("sysinfo");

  return 0;
}