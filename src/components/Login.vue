<template>
  <div id="login">
    <h1>Login</h1>
    <input type="text" name="username" v-model="input.username" placeholder="Username" />
    <input type="password" name="password" v-model="input.password" placeholder="Password" />
    <button type="button" v-on:click="login()">Login</button>
    <p>
    <label>{{ input.error }}</label>
    </p>
  </div>
</template>

<script>
export default {
  name: 'Login',
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
      var formData = new FormData()
      formData.append('userId', this.input.username)
      formData.append('password', this.input.password)
      this.$http.post(this.$parent.backEndUrl + '/login', formData)
        .then(response => {
          if (response.body === 'Logged') {
            this.$emit('authenticated', true)
            this.$router.replace({ name: 'stats' })
            this.input.error = 'ok'
          } else {
            this.input.error = 'The username and / or password is incorrect'
          }
        }, response => {
          this.input.error = 'The username and / or password is incorrect'
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
