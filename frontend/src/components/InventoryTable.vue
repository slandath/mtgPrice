<script setup lang="ts">
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import Button from "primevue/button";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Column from "primevue/column";
import DataTable, { type DataTableRowEditSaveEvent } from "primevue/datatable";
import Message from "primevue/message";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { computed, ref, reactive } from "vue";
import { fetchFromAPI } from "@/api";
import SearchBar from "@/components/SearchBar.vue";

interface InventoryItem {
  id: string;
  userId: string;
  name: string;
  quantity: number;
  currentPrice: string; // numeric from Drizzle → string in JS
  cost: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

const queryClient = useQueryClient();
const editingRows = ref<InventoryItem[]>([]);
const loadingItems = reactive<Record<string, boolean>>({});
const search = ref("");
const toast = useToast();
const confirm = useConfirm();

const { isPending, isFetching, isError, data, error } = useQuery({
  queryKey: ["items"],
  queryFn: () => fetchFromAPI("/api/inventory"),
  staleTime: 30 * 60 * 1000,
});

const filteredItems = computed(() => {
  const items = data.value?.inventory ?? [];
  const q = search.value.trim().toLowerCase();
  return q ? items.filter((item: InventoryItem) => item.name.toLowerCase().includes(q)) : items;
});

const fetchPriceMutation = useMutation({
  mutationFn: async (id: string) => {
    loadingItems[id] = true;
    try {
      return await fetchFromAPI(`/api/inventory/${id}/fetch-price`, { method: "PATCH" });
    } finally {
      loadingItems[id] = false;
    }
  },
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["items"] }),
});

const saveEditMutation = useMutation({
  mutationFn: async (item: InventoryItem) => {
    const { id, userId, currentPrice, url, createdAt, updatedAt, ...fields } = item;
    const payload = {
      ...fields,
      cost: Number(fields.cost),
    };
    return fetchFromAPI(`/api/inventory/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  onSuccess: async (_data, variables) => {
    queryClient.invalidateQueries({ queryKey: ["items"] });
    fetchPriceMutation.mutate(variables.id);
  },
  onError: (error) => {
    console.error("Failed to save item:", error);
    toast.add({
      severity: "error",
      summary: "Data Error",
      detail: `Failed to save item: ${error.message}`,
    });
  },
});

const deleteItemMutation = useMutation({
  mutationFn: (id: string) => fetchFromAPI(`/api/inventory/${id}`, { method: "DELETE" }),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ["items"] });
    toast.add({ severity: "success", summary: "Deleted", detail: "Item removed from inventory" });
  },
  onError: (error) => {
    console.error("Failed to delete item:", error);
    toast.add({
      severity: "error",
      summary: "Data Error",
      detail: `Failed to delete: ${error.message}`,
    });
  },
});

function confirmDelete(item: InventoryItem) {
  confirm.require({
    header: "Delete Item",
    message: `Delete "${item.name}"? This cannot be undone.`,
    icon: "pi pi-exclamation-triangle",
    rejectLabel: "Cancel",
    acceptLabel: "Delete",
    acceptProps: { severity: "danger" },
    accept: () => deleteItemMutation.mutate(item.id),
  });
}
</script>

<template>
  <div class="table-container">
    <Message v-if="isPending" severity="secondary" size="large" variant="simple"
      >Loading...</Message
    >
    <Message v-else-if="isError" severity="error" size="large" variant="simple"
      >Error: {{ error?.message }}</Message
    >
    <div v-else>
      <SearchBar v-model="search" />
      <DataTable
        :value="filteredItems"
        :loading="isFetching"
        editMode="row"
        v-model:editingRows="editingRows"
        dataKey="id"
        @row-edit-save="
          (e: DataTableRowEditSaveEvent<InventoryItem>) => saveEditMutation.mutate(e.newData)
        "
        paginator
        :rows="10"
        :rowsPerPageOptions="[10, 25, 50]"
        scrollable
        scrollHeight="80vh"
      >
        <Column field="quantity" header="Qty" sortable>
          <template #editor="{ data, field }">
            <InputNumber v-model="data[field]" :min="1" fluid autofocus />
          </template>
        </Column>
        <Column field="name" header="Name" sortable>
          <template #editor="{ data, field }">
            <InputText v-model="data[field]" fluid />
          </template>
        </Column>
        <Column field="currentPrice" header="Current Price" sortable>
          <template #body="slotProps"> $ {{ slotProps.data.currentPrice }} </template>
        </Column>
        <Column field="cost" header="Paid (Each)" sortable>
          <template #body="slotProps"> $ {{ slotProps.data.cost }} </template>
          <template #editor="{ data, field }">
            <InputNumber
              v-model.number="data[field]"
              mode="currency"
              currency="USD"
              locale="en-US"
              fluid
            />
          </template>
        </Column>
        <Column
          :rowEditor="true"
          style="width: 10%; min-width: 8rem"
          bodyStyle="text-align:center"
        ></Column>
        <Column header="Delete" style="width: 8%; min-width: 6rem" bodyStyle="text-align:center">
          <template #body="slotProps">
            <Button
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              :disabled="deleteItemMutation.isPending.value"
              :aria-label="`Delete ${slotProps.data.name}`"
              @click="confirmDelete(slotProps.data)"
            />
          </template>
        </Column>
        <template #empty> No items match your search. </template>
      </DataTable>
    </div>
  </div>
</template>
