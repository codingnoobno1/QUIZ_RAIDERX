export const codeTemplates = {
  javascript: `function reverseString(str) {
  return str.split('').reverse().join('');
}`,
  python: `def reverse_string(s):
    return s[::-1]`,
  cpp: `#include <iostream>
#include <string>
using namespace std;

string reverseString(string s) {
    reverse(s.begin(), s.end());
    return s;
}`,
  java: `public class Solution {
  public static String reverseString(String s) {
    return new StringBuilder(s).reverse().toString();
  }
}`,
};
