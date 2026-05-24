import { db } from "@workspace/db";
import { problemsTable } from "@workspace/db";

const problems = [
  {
    title: "Two Sum",
    difficulty: "easy",
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
    ],
    tags: ["array", "hash-table"],
    testCases: [
      { input: "2 7 11 15\n9", expectedOutput: "0 1" },
      { input: "3 2 4\n6", expectedOutput: "1 2" },
    ],
    starterCode: {
      javascript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n    // Your code here\n}`,
      python: `def twoSum(nums, target):\n    # Your code here\n    pass`,
      cpp: `#include <vector>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& nums, int target) {\n    // Your code here\n}`,
      java: `import java.util.*;\n\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your code here\n        return new int[]{};\n    }\n}`,
    },
  },
  {
    title: "Is Prime",
    difficulty: "easy",
    description: `Given an integer \`n\`, return \`true\` if it is a prime number, and \`false\` otherwise.

A prime number is a natural number greater than 1 that is not a product of two smaller natural numbers.`,
    constraints: "1 <= n <= 10^6",
    examples: [
      { input: "n = 7", output: "true", explanation: "7 is prime." },
      { input: "n = 4", output: "false", explanation: "4 = 2 × 2." },
    ],
    tags: ["math"],
    testCases: [
      { input: "7", expectedOutput: "true" },
      { input: "4", expectedOutput: "false" },
      { input: "2", expectedOutput: "true" },
    ],
    starterCode: {
      javascript: `function isPrime(n) {\n    // Your code here\n}`,
      python: `def isPrime(n):\n    # Your code here\n    pass`,
      cpp: `bool isPrime(int n) {\n    // Your code here\n}`,
      java: `class Solution {\n    public boolean isPrime(int n) {\n        // Your code here\n        return false;\n    }\n}`,
    },
  },
  {
    title: "Reverse String",
    difficulty: "easy",
    description: `Write a function that reverses a string. The input string is given as an array of characters \`s\`.

You must do this by modifying the input array in-place with O(1) extra memory.`,
    constraints: "1 <= s.length <= 10^5\ns[i] is a printable ASCII character.",
    examples: [
      { input: 'input = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]' },
      { input: 'input = ["H","a","n","n","a","h"]', output: '["h","a","n","n","a","H"]' },
    ],
    tags: ["string", "two-pointers"],
    testCases: [
      { input: "hello", expectedOutput: "olleh" },
      { input: "Hannah", expectedOutput: "hannaH" },
    ],
    starterCode: {
      javascript: `function reverseString(s) {\n    // Your code here\n}`,
      python: `def reverseString(s):\n    # Your code here\n    pass`,
      cpp: `#include <string>\nusing namespace std;\nstring reverseString(string s) {\n    // Your code here\n}`,
      java: `class Solution {\n    public String reverseString(String s) {\n        // Your code here\n        return "";\n    }\n}`,
    },
  },
  {
    title: "Binary Search",
    difficulty: "medium",
    description: `Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, then return its index. Otherwise, return \`-1\`.

You must write an algorithm with \`O(log n)\` runtime complexity.`,
    constraints: "1 <= nums.length <= 10^4\n-10^4 < nums[i], target < 10^4\nAll the integers in nums are unique.\nnums is sorted in ascending order.",
    examples: [
      { input: "nums = [-1,0,3,5,9,12], target = 9", output: "4", explanation: "9 exists in nums and its index is 4." },
      { input: "nums = [-1,0,3,5,9,12], target = 2", output: "-1", explanation: "2 does not exist in nums so return -1." },
    ],
    tags: ["array", "binary-search"],
    testCases: [
      { input: "-1 0 3 5 9 12\n9", expectedOutput: "4" },
      { input: "-1 0 3 5 9 12\n2", expectedOutput: "-1" },
    ],
    starterCode: {
      javascript: `function search(nums, target) {\n    // Your code here\n}`,
      python: `def search(nums, target):\n    # Your code here\n    pass`,
      cpp: `#include <vector>\nusing namespace std;\nint search(vector<int>& nums, int target) {\n    // Your code here\n}`,
      java: `class Solution {\n    public int search(int[] nums, int target) {\n        // Your code here\n        return -1;\n    }\n}`,
    },
  },
  {
    title: "Merge Intervals",
    difficulty: "medium",
    description: `Given an array of \`intervals\` where \`intervals[i] = [starti, endi]\`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.`,
    constraints: "1 <= intervals.length <= 10^4\nintervals[i].length == 2\n0 <= starti <= endi <= 10^4",
    examples: [
      { input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]", explanation: "Since intervals [1,3] and [2,6] overlap, merge them into [1,6]." },
      { input: "intervals = [[1,4],[4,5]]", output: "[[1,5]]" },
    ],
    tags: ["array", "sorting"],
    testCases: [
      { input: "1 3\n2 6\n8 10\n15 18", expectedOutput: "1 6\n8 10\n15 18" },
    ],
    starterCode: {
      javascript: `function merge(intervals) {\n    // Your code here\n}`,
      python: `def merge(intervals):\n    # Your code here\n    pass`,
      cpp: `#include <vector>\nusing namespace std;\nvector<vector<int>> merge(vector<vector<int>>& intervals) {\n    // Your code here\n}`,
      java: `class Solution {\n    public int[][] merge(int[][] intervals) {\n        // Your code here\n        return new int[][]{};\n    }\n}`,
    },
  },
  {
    title: "Valid Parentheses",
    difficulty: "easy",
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
- Open brackets must be closed by the same type of brackets.
- Open brackets must be closed in the correct order.
- Every close bracket has a corresponding open bracket of the same type.`,
    constraints: "1 <= s.length <= 10^4\ns consists of parentheses only '()[]{}'.",
    examples: [
      { input: 's = "()"', output: "true" },
      { input: 's = "()[]{}"', output: "true" },
      { input: 's = "(]"', output: "false" },
    ],
    tags: ["string", "stack"],
    testCases: [
      { input: "()", expectedOutput: "true" },
      { input: "()[]{}", expectedOutput: "true" },
      { input: "(]", expectedOutput: "false" },
    ],
    starterCode: {
      javascript: `function isValid(s) {\n    // Your code here\n}`,
      python: `def isValid(s):\n    # Your code here\n    pass`,
      cpp: `#include <string>\nusing namespace std;\nbool isValid(string s) {\n    // Your code here\n}`,
      java: `class Solution {\n    public boolean isValid(String s) {\n        // Your code here\n        return false;\n    }\n}`,
    },
  },
  {
    title: "Maximum Subarray",
    difficulty: "medium",
    description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.`,
    constraints: "1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4",
    examples: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "The subarray [4,-1,2,1] has the largest sum 6." },
      { input: "nums = [1]", output: "1" },
    ],
    tags: ["array", "dynamic-programming"],
    testCases: [
      { input: "-2 1 -3 4 -1 2 1 -5 4", expectedOutput: "6" },
      { input: "1", expectedOutput: "1" },
    ],
    starterCode: {
      javascript: `function maxSubArray(nums) {\n    // Your code here\n}`,
      python: `def maxSubArray(nums):\n    # Your code here\n    pass`,
      cpp: `#include <vector>\nusing namespace std;\nint maxSubArray(vector<int>& nums) {\n    // Your code here\n}`,
      java: `class Solution {\n    public int maxSubArray(int[] nums) {\n        // Your code here\n        return 0;\n    }\n}`,
    },
  },
  {
    title: "Number of Islands",
    difficulty: "medium",
    description: `Given an \`m x n\` 2D binary grid \`grid\` which represents a map of \`'1'\`s (land) and \`'0'\`s (water), return the number of islands.

An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.`,
    constraints: "m == grid.length\nn == grid[i].length\n1 <= m, n <= 300\ngrid[i][j] is '0' or '1'.",
    examples: [
      { input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: "1" },
    ],
    tags: ["graph", "bfs", "dfs"],
    testCases: [
      { input: "1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0", expectedOutput: "1" },
    ],
    starterCode: {
      javascript: `function numIslands(grid) {\n    // Your code here\n}`,
      python: `def numIslands(grid):\n    # Your code here\n    pass`,
      cpp: `#include <vector>\nusing namespace std;\nint numIslands(vector<vector<char>>& grid) {\n    // Your code here\n}`,
      java: `class Solution {\n    public int numIslands(char[][] grid) {\n        // Your code here\n        return 0;\n    }\n}`,
    },
  },
  {
    title: "Climbing Stairs",
    difficulty: "easy",
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb \`1\` or \`2\` steps. In how many distinct ways can you climb to the top?`,
    constraints: "1 <= n <= 45",
    examples: [
      { input: "n = 2", output: "2", explanation: "There are two ways to climb to the top: 1. 1 step + 1 step 2. 2 steps" },
      { input: "n = 3", output: "3", explanation: "There are three ways to climb: 1+1+1, 1+2, 2+1" },
    ],
    tags: ["dynamic-programming", "math"],
    testCases: [
      { input: "2", expectedOutput: "2" },
      { input: "3", expectedOutput: "3" },
      { input: "5", expectedOutput: "8" },
    ],
    starterCode: {
      javascript: `function climbStairs(n) {\n    // Your code here\n}`,
      python: `def climbStairs(n):\n    # Your code here\n    pass`,
      cpp: `int climbStairs(int n) {\n    // Your code here\n}`,
      java: `class Solution {\n    public int climbStairs(int n) {\n        // Your code here\n        return 0;\n    }\n}`,
    },
  },
  {
    title: "Linked List Cycle",
    difficulty: "easy",
    description: `Given \`head\`, the head of a linked list, determine if the linked list has a cycle in it.

There is a cycle in a linked list if there is some node in the list that can be reached again by continuously following the \`next\` pointer.

Return \`true\` if there is a cycle in the linked list. Otherwise, return \`false\`.`,
    constraints: "The number of nodes in the list is in the range [0, 10^4].\n-10^5 <= Node.val <= 10^5\npos is -1 or a valid index in the linked-list.",
    examples: [
      { input: "head = [3,2,0,-4], pos = 1", output: "true", explanation: "There is a cycle in the linked list, where the tail connects to the 1st node (0-indexed)." },
      { input: "head = [1,2], pos = 0", output: "true" },
    ],
    tags: ["linked-list", "two-pointers"],
    testCases: [
      { input: "3 2 0 -4\n1", expectedOutput: "true" },
      { input: "1\n-1", expectedOutput: "false" },
    ],
    starterCode: {
      javascript: `function hasCycle(head) {\n    // Use fast/slow pointer approach\n}`,
      python: `def hasCycle(head):\n    # Use fast/slow pointer approach\n    pass`,
      cpp: `bool hasCycle(ListNode *head) {\n    // Use fast/slow pointer approach\n}`,
      java: `public boolean hasCycle(ListNode head) {\n    // Use fast/slow pointer approach\n    return false;\n}`,
    },
  },
  {
    title: "Word Search",
    difficulty: "medium",
    description: `Given an \`m x n\` grid of characters \`board\` and a string \`word\`, return \`true\` if \`word\` exists in the grid.

The word can be constructed from letters of sequentially adjacent cells, where adjacent cells are horizontally or vertically neighboring. The same letter cell may not be used more than once.`,
    constraints: "m == board.length\nn == board[i].length\n1 <= m, n <= 6\n1 <= word.length <= 15\nboard and word consists of only lowercase and uppercase English letters.",
    examples: [
      { input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"', output: "true" },
    ],
    tags: ["graph", "backtracking", "dfs"],
    testCases: [
      { input: "A B C E\nS F C S\nA D E E\nABCCED", expectedOutput: "true" },
    ],
    starterCode: {
      javascript: `function exist(board, word) {\n    // Your code here\n}`,
      python: `def exist(board, word):\n    # Your code here\n    pass`,
      cpp: `bool exist(vector<vector<char>>& board, string word) {\n    // Your code here\n}`,
      java: `public boolean exist(char[][] board, String word) {\n    // Your code here\n    return false;\n}`,
    },
  },
  {
    title: "Course Schedule",
    difficulty: "hard",
    description: `There are a total of \`numCourses\` courses you have to take, labeled from \`0\` to \`numCourses - 1\`. You are given an array \`prerequisites\` where \`prerequisites[i] = [ai, bi]\` indicates that you must take course \`bi\` first if you want to take course \`ai\`.

Return \`true\` if you can finish all courses. Otherwise, return \`false\`.`,
    constraints: "1 <= numCourses <= 2000\n0 <= prerequisites.length <= 5000\nprerequisites[i].length == 2\n0 <= ai, bi < numCourses\nAll the pairs prerequisites[i] are unique.",
    examples: [
      { input: "numCourses = 2, prerequisites = [[1,0]]", output: "true", explanation: "To take course 1 you should have finished course 0." },
      { input: "numCourses = 2, prerequisites = [[1,0],[0,1]]", output: "false", explanation: "Cycle detected." },
    ],
    tags: ["graph", "topological-sort", "bfs"],
    testCases: [
      { input: "2\n1 0", expectedOutput: "true" },
      { input: "2\n1 0\n0 1", expectedOutput: "false" },
    ],
    starterCode: {
      javascript: `function canFinish(numCourses, prerequisites) {\n    // Your code here\n}`,
      python: `def canFinish(numCourses, prerequisites):\n    # Your code here\n    pass`,
      cpp: `bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {\n    // Your code here\n}`,
      java: `public boolean canFinish(int numCourses, int[][] prerequisites) {\n    // Your code here\n    return false;\n}`,
    },
  },
  {
    title: "Median of Two Sorted Arrays",
    difficulty: "hard",
    description: `Given two sorted arrays \`nums1\` and \`nums2\` of size \`m\` and \`n\` respectively, return the median of the two sorted arrays.

The overall run time complexity should be \`O(log (m+n))\`.`,
    constraints: "nums1.length == m\nnums2.length == n\n0 <= m <= 1000\n0 <= n <= 1000\n1 <= m + n <= 2000\n-10^6 <= nums1[i], nums2[i] <= 10^6",
    examples: [
      { input: "nums1 = [1,3], nums2 = [2]", output: "2.00000", explanation: "merged array = [1,2,3] and median is 2." },
      { input: "nums1 = [1,2], nums2 = [3,4]", output: "2.50000" },
    ],
    tags: ["array", "binary-search", "divide-and-conquer"],
    testCases: [
      { input: "1 3\n2", expectedOutput: "2.00000" },
      { input: "1 2\n3 4", expectedOutput: "2.50000" },
    ],
    starterCode: {
      javascript: `function findMedianSortedArrays(nums1, nums2) {\n    // Your code here\n}`,
      python: `def findMedianSortedArrays(nums1, nums2):\n    # Your code here\n    pass`,
      cpp: `double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {\n    // Your code here\n}`,
      java: `public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n    // Your code here\n    return 0.0;\n}`,
    },
  },
];

async function seed() {
  console.log("Seeding problems...");
  for (const problem of problems) {
    await db.insert(problemsTable).values({
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty,
      constraints: problem.constraints ?? null,
      examples: problem.examples,
      testCases: problem.testCases,
      tags: problem.tags,
      starterCode: problem.starterCode,
    }).onConflictDoNothing();
  }
  console.log(`Seeded ${problems.length} problems.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
