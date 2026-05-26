<script setup lang="ts">
import { authClient } from '@/auth-client';
import { useRouter } from 'vue-router';

const router = useRouter()

async function handleSignOut() {
    try {
        await authClient.signOut()
        router.push('/')
    }
    catch (err) {
        console.warn(`Sign out error: ${err}`)
    }
}

</script>

<template>
    <header>
        <nav>
            <ul>
                <li><h1><RouterLink to ="/">MTG Price Tracker</RouterLink></h1></li>
            </ul>
            <ul>
                <li><button @click="router.push('/add')"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE --><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7-7v14"/></svg></button></li>
                <li><button @click="handleSignOut"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE --><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m16 17l5-5l-5-5m5 5H9m0 9H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/></svg></button></li>
            </ul>
        </nav>
    </header>
</template>