/// <reference types="vitest/global.d.ts" />

import { mount } from '@vue/test-utils'
import TitleHead from '../src/components/TitleHead.vue'

test('mount component', async() => {
  expect(TitleHead).toBeTruthy()

  const wrapper = mount(TitleHead, {
    props: {
      title: 'test 1',
      big: false,
    },
  })

  expect(wrapper.text()).toContain('test 1')
  expect(wrapper.html()).toMatchSnapshot()

  await wrapper.get('button').trigger('click')

  expect(wrapper.text()).toContain('4 x 3 = 12')

  await wrapper.get('button').trigger('click')

  expect(wrapper.text()).toContain('4 x 4 = 16')
})
