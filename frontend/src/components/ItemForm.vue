<script setup lang="ts">
import { fetchFromAPI } from '@/api';
import { useMutation } from '@tanstack/vue-query';
import { reactive } from 'vue';

const formData = reactive({
    name: '',
    quantity: 1,
    cost: '',
    url: ''
})

const emit = defineEmits<{
    (e: 'item-added'): void
}>()

const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
        return fetchFromAPI('/api/inventory', {
            method: 'POST',
            body: JSON.stringify(data)
        })
    },
    onSuccess: () => {
        formData.name = ''
        formData.quantity = 1
        formData.cost = ''
        formData.url = ''
        emit('item-added')
    }
})

function handleSubmit() {
    mutation.mutate({ ...formData })
}

</script>

<template>
    <form @submit.prevent="handleSubmit">
        <span v-if="mutation.isError.value" class="pico-background-red-500">{{ mutation.error.value?.message }}</span>
        <fieldset>
        <label>
            Quantity
        </label>
        <input v-model="formData.quantity" type="number" name="quantity" placeholder="Qty" aria-label="Qty" required>
        <label>
            Name
        </label>
        <input v-model="formData.name" type="text" name="text" placeholder="Name" aria-label="Name" required>
        <label>
            Cost
        </label>
        <input v-model="formData.cost" type="number" name="cost" placeholder="Cost" aria-label="Cost" required>
        <label>
            URL
        </label>
        <input v-model="formData.url" type="text" name="text" placeholder="URL" aria-label="URL" required>
        </fieldset>
        <input type="submit" value="Add Item" />
    </form>
</template>