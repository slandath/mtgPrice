<script setup lang="ts">
import { authClient } from '@/auth-client';
import { Button } from 'primevue';
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
        <nav class="navbar">
            <ul class="flex">
                <li><h1><RouterLink to ="/">MTG Price Tracker</RouterLink></h1></li>
            </ul>
            <ul class="flex">
                <li><Button @click="router.push('/add')" icon="pi pi-plus" /></li>
                <li><Button @click="handleSignOut" icon="pi pi-sign-out" /></li>
            </ul>
        </nav>
    </header>
</template>