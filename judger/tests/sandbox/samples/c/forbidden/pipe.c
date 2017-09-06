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

int main(){
  int pipefd[2];
  if (pipe(pipefd) == -1) {
        perror("pipe");
        exit(EXIT_FAILURE);
    }

  return 0;
}