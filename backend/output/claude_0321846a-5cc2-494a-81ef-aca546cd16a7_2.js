function formatFromObject({ path, code }) {
  return `#path ${path} #path #code ${code} #code`;
}

// formatFromObject({ path: 'app/services/FileService.js', code: '...' })