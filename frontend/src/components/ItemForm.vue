<script setup lang="ts">
import type { FormSubmitEvent } from "@primevue/forms";
import { Form } from "@primevue/forms";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { useMutation } from "@tanstack/vue-query";
import Button from "primevue/button";
import FloatLabel from "primevue/floatlabel";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import { z } from "zod";
import { fetchFromAPI } from "@/api";
import { useToast } from "primevue/usetoast";
import { ref } from "vue";

const toast = useToast();
const formRef = ref();

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  cost: z.number({ error: "Cost is required" }).min(0, "Cost must be positive"),
  url: z.url("Must be a valid URL").min(1, "URL is required"),
});

const initialValues = {
  name: "",
  quantity: 1,
  cost: null as number | null,
  url: "",
};

const resolver = zodResolver(schema);

const mutation = useMutation({
  mutationFn: async (data: typeof initialValues) => {
    return fetchFromAPI("/api/inventory", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  onSuccess: () => {
    toast.add({
      severity: "success",
      summary: "Item Added!",
      life: 3000,
    });
    formRef.value?.reset();
  },
});

function handleSubmit({ valid, values }: FormSubmitEvent) {
  if (valid) {
    mutation.mutate(values as typeof initialValues);
  }
}
</script>

<template>
  <div class="form-container">
    <Form
      ref="formRef"
      v-slot="$form"
      :initial-values
      :resolver
      :validate-on-blur="true"
      @submit="handleSubmit"
    >
      <h2>Add Item</h2>
      <div class="spacer">
        <FloatLabel variant="on">
          <InputNumber name="quantity" input-id="quantity" fluid />
          <label for="quantity">Quantity</label>
        </FloatLabel>
        <Message v-if="$form.quantity?.invalid" severity="error" size="small" variant="simple">
          {{ $form.quantity.error?.message }}
        </Message>
      </div>
      <div class="spacer">
        <FloatLabel variant="on">
          <InputText id="name" name="name" fluid />
          <label for="name">Name</label>
        </FloatLabel>
        <Message
          v-if="$form.name?.invalid"
          severity="error"
          size="small"
          variant="simple"
          class="padding"
        >
          {{ $form.name.error?.message }}
        </Message>
      </div>
      <div class="spacer">
        <FloatLabel variant="on">
          <InputNumber
            name="cost"
            mode="currency"
            currency="USD"
            locale="en-US"
            input-id="cost"
            fluid
          />
          <label for="cost">Cost</label>
        </FloatLabel>
        <Message
          v-if="$form.cost?.invalid"
          severity="error"
          size="small"
          variant="simple"
          class="padding"
        >
          {{ $form.cost.error?.message }}
        </Message>
      </div>
      <div class="spacer">
        <FloatLabel variant="on">
          <InputText id="url" name="url" fluid />
          <label for="url">URL</label>
        </FloatLabel>
        <Message
          v-if="$form.url?.invalid"
          severity="error"
          size="small"
          variant="simple"
          class="padding"
        >
          {{ $form.url.error?.message }}
        </Message>
        <Message size="small" severity="secondary" variant="simple" class="padding">
          Paste the TCG Player webpage
        </Message>
      </div>
      <Button type="submit" label="Submit" :loading="mutation.isPending.value" />
    </Form>
  </div>
</template>
