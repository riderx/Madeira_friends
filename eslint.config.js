import process from 'node:process'
import antfu from '@antfu/eslint-config'

export default antfu({
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
  },
  ignores: ['dist', 'public', '**/supabase.types*', 'CHANGELOG.md', 'scripts', '.github'],
})
