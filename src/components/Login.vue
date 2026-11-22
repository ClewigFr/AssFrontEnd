<template>
  <div id="login">
    <h1>Login</h1>
    <input
      v-model="input.username"
      type="text"
      name="username"
      placeholder="Username"
    >
    <input
      v-model="input.password"
      type="password"
      name="password"
      placeholder="Password"
    >
    <button
      type="button"
      @click="login()"
    >
      Login
    </button>
    <p>
      <label>{{ input.error }}</label>
    </p>
  </div>
</template>

<script>
import { api } from '@/api'

export default {
  name: 'LoginPage',
  emits: ['authenticated'],
  data () {
    return {
      input: {
        username: '',
        password: '',
        error: ''
      }
    }
  },
  methods: {
    login () {
      this.input.error = 'Login...'
      api.postForm('login', { userId: this.input.username, password: this.input.password })
        .then(body => {
          if (body === 'Logged') {
            this.input.error = ''
            this.$emit('authenticated', true)
          } else {
            this.input.error = 'The username and / or password is incorrect'
          }
        })
        .catch(error => {
          this.input.error = error.status === 429
            ? 'Too many failed attempts, try again in 15 minutes'
            : 'The username and / or password is incorrect'
        })
    }
  }
}
</script>

<style scoped>
#login {
  width: 500px;
  border: 1px solid #cccccc;
  background-color: #ffffff;
  margin: auto;
  margin-top: 200px;
  padding: 20px;
}
</style>
