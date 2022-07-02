<script setup lang="ts">
import {

} from '@ionic/vue'
import {

} from 'ionicons/icons'
import { watchEffect } from 'vue'
import './RandomAvatar.scss'

const props = defineProps({
  size: String,
  customSize: String,
})

const USERS: any[] = [
  {
    id: 1,
    name: 'Black Panther',
    profileUrl: 'assets/img/avatars/blackpanther.png',
  },
  {
    id: 2,
    name: 'Black Widow',
    profileUrl: 'assets/img/avatars/blackwidow.png',
  },
  {
    id: 3,
    name: 'Captain',
    profileUrl: 'assets/img/avatars/captain.png',
  },
  {
    id: 4,
    name: 'Hieu Pham',
    profileUrl: 'assets/img/avatars/hieu.png',
  },
  {
    id: 5,
    name: 'Bruce Banner (Hulk)',
    profileUrl: 'assets/img/avatars/hulk.png',
  },
  {
    id: 6,
    name: 'Thanos',
    profileUrl: 'assets/img/avatars/thanos.png',
  },
  {
    id: 7,
    name: 'Iron Man',
    profileUrl: 'assets/img/avatars/ironman.png',
  },
  {
    id: 8,
    name: 'Scarlet Witch',
    profileUrl: 'assets/img/avatars/scarwitch.png',
  },
  {
    id: 9,
    name: 'Spiderman',
    profileUrl: 'assets/img/avatars/spiderman.png',
  },
  {
    id: 10,
    name: 'Thor',
    profileUrl: 'assets/img/avatars/thor.png',
  },
]

const randomIndex = Math.floor(Math.random() * (USERS.length - 1))
const imageUrl = `${USERS[randomIndex].profileUrl}`
const styles: any = {
  backgroundImage: `url(${imageUrl})`,
}
let classes = 'avatar'

watchEffect(() => {
  if (props.customSize) {
    styles.width = props.customSize
    styles.height = props.customSize
  }
  if (props.size)
    classes = `${classes} avatar-${props.size}`
})
</script>

<template>
  <div class="random-avatar">
    <div
      :class="classes"
      :style="styles"
    />
  </div>
</template>
