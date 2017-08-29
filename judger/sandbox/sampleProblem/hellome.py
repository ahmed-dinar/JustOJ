
import sys
n = int(input())
for x in range(0, n):
	numbers = list(map(int, input().split()))
	print("Case %d: %d" % ( x+1, numbers[0] + numbers[1]))

