<script setup lang="ts">
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Column from "primevue/column";
import DataTable, { type DataTableRowEditSaveEvent } from "primevue/datatable";
import Message from "primevue/message";
import { useToast } from "primevue/usetoast";
import { ref, reactive } from "vue";
import { fetchFromAPI } from "@/api";

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
const toast = useToast();

const { isPending, isFetching, isError, data, error } = useQuery({
  queryKey: ["items"],
  queryFn: () => fetchFromAPI("/api/inventory"),
  staleTime: 30 * 60 * 1000,
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
</script>

<template>
  <Message v-if="isPending" severity="secondary" size="large" variant="simple" class="padding"
    >Loading...</Message
  >
  <span v-else-if="isError">Error: {{ error?.message }}</span>
  <DataTable
    v-else-if="data"
    :value="data.inventory"
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
    class="table-container"
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
  </DataTable>
</template>
