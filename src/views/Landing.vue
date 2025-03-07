<script setup lang="ts">
import { useRouter } from 'vue-router'
import ContactForm from '../components/landing/ContactForm.vue'
import Hero from '../components/landing/Hero.vue'
import Stats from '../components/landing/Stats.vue'
import { submitContactForm } from '../services/contactService'

const router = useRouter()

function navigateToRegister() {
  router.push('/auth')
}

async function handleContactSubmit(formData: any) {
  try {
    // Submit the form data to the contact service
    const result = await submitContactForm(formData)

    if (!result.success) {
      throw new Error(result.error)
    }

    return true
  }
  catch (e) {
    console.error('Error submitting contact form:', e)
    throw e
  }
}
</script>

<template>
  <div class="min-h-screen text-white bg-black">
    <Hero />

    <!-- Purpose Section -->
    <section class="py-16">
      <div class="container px-4 mx-auto text-center">
        <h2 class="mb-8 text-3xl font-bold">
          OUR PURPOSE
        </h2>
        <div class="max-w-4xl mx-auto space-y-8">
          <p class="text-xl">
            Madeira Friends is more than just a community - we're a bridge
            connecting people from all walks of life on this beautiful island.
            Our mission is to create meaningful connections, foster cultural
            exchange, and build a supportive ecosystem for everyone who calls
            Madeira home.
          </p>

          <div class="grid gap-8 md:grid-cols-2">
            <div class="p-8 border-2 border-white">
              <h3 class="mb-4 text-xl font-bold">
                OUR VISION
              </h3>
              <p>
                To transform Madeira into a thriving hub where locals and
                internationals collaborate, innovate, and create lasting
                positive impact together. We believe in the power of community
                to drive sustainable growth and cultural enrichment.
              </p>
            </div>

            <div class="p-8 border-2 border-white">
              <h3 class="mb-4 text-xl font-bold">
                OUR VALUES
              </h3>
              <ul class="space-y-2 text-left">
                <li>
                  • Community First: Every decision we make is for the benefit
                  of our community
                </li>
                <li>
                  • Cultural Bridge: Fostering understanding between locals and
                  internationals
                </li>
                <li>
                  • Sustainable Impact: Creating long-lasting positive change in
                  Madeira
                </li>
                <li>
                  • Genuine Connections: Building real, meaningful relationships
                </li>
              </ul>
            </div>
          </div>

          <p class="text-xl">
            Whether you're a digital nomad seeking your next adventure, a local
            wanting to expand your horizons, or an expat making Madeira your new
            home - you'll find your place here. Together, we're building a more
            connected, vibrant, and inclusive Madeira.
          </p>

          <div class="flex justify-center">
            <button
              class="px-6 py-3 font-bold text-black transition-colors duration-200 bg-white border-2 border-white cursor-pointer hover:bg-black hover:text-white"
              @click="navigateToRegister"
            >
              JOIN OUR COMMUNITY
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Founders Section -->
    <section class="py-16 text-black bg-white">
      <div class="container px-4 mx-auto text-center">
        <h2 class="mb-8 text-3xl font-bold">
          MEET THE FOUNDERS MARELIN & LUIS
        </h2>
        <p class="mb-8 text-xl">
          We're givers, not takers
        </p>
        <img
          src="/assets/0dda504c1271353caf0da902a832d69b.jpg?v=0b5e7665"
          alt="Picture of the founders Luis and Marelin"
          class="w-full max-w-2xl mx-auto rounded-lg"
        >
      </div>
    </section>

    <!-- Mission Section -->
    <section class="py-16">
      <div class="container px-4 mx-auto text-center">
        <h2 class="mb-16 text-3xl font-bold">
          We bridge the gap and connect the dots between locals, digital nomads,
          remote workers & expats
        </h2>

        <div class="grid gap-8 mb-16 md:grid-cols-3">
          <div class="space-y-4">
            <img
              src="/assets/9740224e2b2027d5804437920ff0ae8b.jpg?v=0b5e7665"
              alt="Community"
              class="object-cover w-full rounded-lg aspect-video"
            >
            <h3 class="text-xl font-bold">
              VIBRANT COMMUNITY
            </h3>
            <p>Onboarding, day-to-day support, help, events and activities</p>
          </div>

          <div class="space-y-4">
            <img
              src="/assets/cb7da4affd3eb25a331f9295842a2da4.jpg?v=0b5e7665"
              alt="Social Programs"
              class="object-cover w-full rounded-lg aspect-video"
            >
            <h3 class="text-xl font-bold">
              SOCIAL PROGRAMS
            </h3>
            <p>Knowledge transfer in schools, non-profits and volunteering</p>
          </div>

          <div class="space-y-4">
            <img
              src="/assets/9b492b4e23e004e9c93fc02c565a943a.jpg?v=0b5e7665"
              alt="Business and Tech"
              class="object-cover w-full rounded-lg aspect-video"
            >
            <h3 class="text-xl font-bold">
              BUSINESS AND TECH
            </h3>
            <p>Technology, networking, opportunities and investment</p>
          </div>
        </div>

        <div class="flex justify-center mb-8">
          <button
            class="px-6 py-3 font-bold text-black transition-colors duration-200 bg-white border-2 border-white cursor-pointer hover:bg-black hover:text-white"
            @click="navigateToRegister"
          >
            JOIN US TODAY
          </button>
        </div>
      </div>
    </section>

    <!-- Activities Grid -->
    <section class="py-16 text-black bg-white">
      <div class="container px-4 mx-auto">
        <div class="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div
            v-for="(activity, index) in [
              { title: 'FITNESS WELLNESS', image: 'image14' },
              { title: 'LUNCHES', image: 'image13' },
              { title: 'MEETUPS', image: 'image15' },
              { title: 'DINNERS', image: 'image16' },
              { title: 'PARTIES', image: 'image17' },
              { title: 'WORKSHOPS', image: 'image19' },
              { title: 'VOLUNTEERING', image: 'image10' },
              { title: 'SKILL-SHARING', image: 'image18' },
            ]"
            :key="index"
            class="text-center"
          >
            <img
              :src="`https://madeirafriends.org/assets/images/${activity.image}.jpg?v=0b5e7665`"
              :alt="activity.title"
              class="object-cover w-full mb-4 rounded-lg aspect-square"
            >
            <h3 class="font-bold">
              {{ activity.title }}
            </h3>
          </div>
        </div>
      </div>
    </section>

    <!-- Services Section -->
    <section class="py-16">
      <div class="container px-4 mx-auto text-center">
        <h2 class="mb-8 text-3xl font-bold">
          THINGS WE DO FOR THE COMMUNITY
        </h2>
        <p class="mb-12 text-xl">
          ALMOST EVERYTHING, REALLY
        </p>

        <div class="grid max-w-4xl gap-8 mx-auto md:grid-cols-2">
          <ul class="space-y-4 text-left">
            <li>✓ Relocate to Madeira</li>
            <li>✓ Accommodation</li>
            <li>✓ Real Estate Property</li>
            <li>✓ Legal & Tax Advice</li>
            <li>✓ Open your company here</li>
          </ul>

          <ul class="space-y-4 text-left">
            <li>✓ Recommendations & tips</li>
            <li>✓ Healthcare</li>
            <li>✓ Car rentals & activities</li>
            <li>✓ Fitness & networking</li>
            <li>✓ Events & venues</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <Stats />

    <!-- Partners Section -->
    <section class="py-16">
      <div class="container px-4 mx-auto text-center">
        <h2 class="mb-4 text-3xl font-bold">
          OUR PARTNERS
        </h2>
        <p class="mb-12 text-xl">
          Want to be part of this mission?
        </p>

        <div
          class="grid max-w-4xl grid-cols-2 gap-8 mx-auto mb-12 md:grid-cols-5"
        >
          <img
            src="/assets/eb504603164af71766f1e999c7019236.png?v=0b5e7665"
            alt="Sangha cowork"
            class="w-full"
          >
          <img
            src="/assets/6771fe6414c4b9757fbcd8bf649813ae.png?v=0b5e7665"
            alt="Sangha cowork"
            class="w-full"
          >
          <img
            src="/assets/2275c9ec2042ab9f0dc9898ccc4403a5.png?v=0b5e7665"
            alt="Logo Digital Nomads Madeira Islands"
            class="w-full"
          >
          <img
            src="/assets/23af35895dac291128650a5f0eb3802d.png?v=0b5e7665"
            alt="Logo Digital Nomads Madeira Islands"
            class="w-full"
          >
          <img
            src="/assets/8669937fefa31f14281d177dc230064f.png?v=0b5e7665"
            alt="Logo Ero Imobiliaria"
            class="w-full"
          >
          <img
            src="/assets/082f23b86af03e177365f1869504906e.png?v=0b5e7665"
            alt="Logo Digital Nomads Madeira Islands"
            class="w-full"
          >
          <img
            src="/assets/e4d99f081aa471efc0846195a67d8e9f.png?v=0b5e7665"
            alt="Logo Digital Nomads Madeira Islands"
            class="w-full"
          >
          <img
            src="/assets/ed8508bf83b62ef2bfcd23c0e9ed2e2e.png?v=0b5e7665"
            alt="Logo Startup Madeira"
            class="w-full"
          >
          <img
            src="/assets/12d58a797b0a3cb0c80ad6532136a25d.png?v=0b5e7665"
            alt="Logo estalagem da ponta do sol"
            class="w-full"
          >
        </div>

        <div class="grid max-w-4xl gap-8 mx-auto mb-12 md:grid-cols-3">
          <div class="p-8 text-center border-2 border-white">
            <h3 class="mb-4 text-xl font-bold">
              BUSINESS
            </h3>
            <p class="mb-4">
              Partner with us to reach the international community
            </p>
            <a href="#contact" class="inline-block px-6 py-3 cursor-pointer btn-primary">
              BECOME A PARTNER
            </a>
          </div>

          <div class="p-8 text-center border-2 border-white">
            <h3 class="mb-4 text-xl font-bold">
              COMMUNITY
            </h3>
            <p class="mb-4">
              Support our mission and help us grow
            </p>
            <a href="#supportus" class="inline-block px-6 py-3 cursor-pointer btn-primary">
              SUPPORT US
            </a>
          </div>

          <div class="p-8 text-center border-2 border-white">
            <h3 class="mb-4 text-xl font-bold">
              COLLABORATION
            </h3>
            <p class="mb-4">
              Let's create something amazing together
            </p>
            <a href="#contact" class="inline-block px-6 py-3 cursor-pointer btn-primary">
              GET IN TOUCH
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Support Section -->
    <section id="supportus" class="py-16 text-black bg-white">
      <div class="container px-4 mx-auto text-center">
        <h2 class="mb-4 text-3xl font-bold">
          COMMUNITY
        </h2>
        <h3 class="mb-4 text-2xl font-bold">
          MONTHLY SUPPORT
        </h3>
        <p class="mb-8 text-xl">
          PROGRESS: 73% ⭐️
        </p>
        <p class="mb-8 text-lg">
          To pay for Marelin and Luis' minimum salary
        </p>

        <div class="flex flex-col justify-center gap-4 mb-12 sm:flex-row">
          <a
            href="https://buy.stripe.com/5kA5ltaTI3vgffOeVb"
            target="_blank"
            class="px-8 py-4 font-bold text-white uppercase bg-black border-2 border-black cursor-pointer hover:bg-white hover:text-black"
          >
            SUPPORT MONTHLY
          </a>
          <a
            href="https://buy.stripe.com/bIY8xF8LA2rc5Fe8wM"
            target="_blank"
            class="px-8 py-4 font-bold text-white uppercase bg-black border-2 border-black cursor-pointer hover:bg-white hover:text-black"
          >
            ONE-OFF DONATION
          </a>
        </div>

        <div class="grid max-w-4xl gap-8 mx-auto text-left md:grid-cols-2">
          <ul class="space-y-4">
            <li>✓ 24/7 help to everyone</li>
            <li>✓ Community onboarding</li>
            <li>✓ Connect with locals and services</li>
            <li>✓ Rentals and real estate help</li>
            <li>✓ Manage whatsapp, slack, instagram, facebook, e-mail</li>
          </ul>
          <ul class="space-y-4">
            <li>✓ Organize events and activities</li>
            <li>✓ Create giving-back initiatives</li>
            <li>✓ Tips and recommendations</li>
            <li>✓ Tax and legal support</li>
            <li>✓ Help relocating to Madeira</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="py-16">
      <div class="container px-4 mx-auto text-center">
        <h2 class="mb-8 text-3xl font-bold">
          GET IN TOUCH
        </h2>
        <ContactForm @submit="handleContactSubmit" />
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-8">
      <div class="container px-4 mx-auto text-center">
        <div class="flex justify-center gap-8 mb-8 text-3xl">
          <a
            href="https://www.facebook.com/groups/804671576962486/"
            target="_blank"
            class="hover:text-white/80"
          >
            <i class="fab fa-facebook" />
          </a>
          <a
            href="https://www.instagram.com/madeirafriends/"
            target="_blank"
            class="hover:text-white/80"
          >
            <i class="fab fa-instagram" />
          </a>
          <a
            href="https://wa.me/+353861856510"
            target="_blank"
            class="hover:text-white/80"
          >
            <i class="fab fa-whatsapp" />
          </a>
          <a href="mailto:hello@madeirafriends.com" class="hover:text-white/80">
            <i class="fas fa-envelope" />
          </a>
        </div>
        <div class="mb-6">
          <button
            class="px-6 py-3 font-bold text-black transition-colors duration-200 bg-yellow-400 border-2 border-yellow-400 cursor-pointer hover:bg-black hover:text-yellow-400"
            @click="navigateToRegister"
          >
            BECOME A MEMBER
          </button>
        </div>
        <p>
          © {{ new Date().getFullYear() }} Madeira Friends. All rights
          reserved.
        </p>
      </div>
    </footer>
  </div>
</template>
