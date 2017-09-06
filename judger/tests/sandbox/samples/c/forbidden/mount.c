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


//https://www.linuxquestions.org/questions/programming-9/how-to-use-mount-function-from-c-920210/
int main(){

  const char* src  = "none";
   const char* trgt = "/var/tmp";
   const char* type = "tmpfs";
   const unsigned long mntflags = 0;
   const char* opts = "mode=0700,uid=65534";   /* 65534 is the uid of nobody */

   int result = mount(src, trgt, type, mntflags, opts);


   if (result == 0)
   {
      printf("Mount created at %s...\n", trgt);
      printf("Press <return> to unmount the volume: ");
      getchar();

      umount(trgt);
   }
   else
   {
      printf("Error : Failed to mount %s\n"
             "Reason: %s [%d]\n",
             src, strerror(errno), errno);
      return -1;
   }

  return 0;
}