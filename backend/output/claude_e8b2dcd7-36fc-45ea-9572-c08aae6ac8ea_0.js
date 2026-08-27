function isPalindrome(str) {
  const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleaned === cleaned.split('').reverse().join('');
}

// Ví dụ dùng:
console.log(isPalindrome("Đo tôi ơi to đo")); // tùy input
console.log(isPalindrome("racecar")); // true
console.log(isPalindrome("hello"));   // false