"use client";

import * as Select from "@radix-ui/react-select";
import { fetchModels } from "@/app/(main)/actions";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface Model {
  label: string;
  value: string;
}

export function ModelSelector({
  currentModel,
  chatId,
  onModelChange,
  disabled,
}: {
  currentModel: string;
  chatId: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}) {
  const [models, setModels] = useState<Model[]>([]);
  const [model, setModel] = useState(currentModel);
  const selectedModel = models.find(m => m.value === model) || models[0];

  useEffect(() => {
    (async () => {
      const models = await fetchModels();
      setModels(models);
    })();
  }, []);

  const handleModelChange = async (value: string) => {
    setModel(value);
    const response = await fetch(`/api/chats/${chatId}/model`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: value }),
    });
    
    if (response.ok) {
      onModelChange(value);
    }
  };

  return (
    <Select.Root name="model" value={model} onValueChange={handleModelChange} disabled={disabled}>
      <Select.Trigger className="inline-flex items-center gap-1 rounded-md p-1 text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300">
        <Select.Value aria-label={selectedModel?.label || ''}>
          <span>{selectedModel?.label || 'Select model'}</span>
        </Select.Value>
        <Select.Icon>
          <ChevronDownIcon className="size-3" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="overflow-hidden rounded-md bg-white shadow ring-1 ring-black/5">
          <Select.Viewport className="space-y-1 p-2">
            {models.map(m => (
              <Select.Item
                key={m.value}
                value={m.value}
                className="flex cursor-pointer items-center gap-1 rounded-md p-1 text-sm data-[highlighted]:bg-gray-100 data-[highlighted]:outline-none"
              >
                <Select.ItemText className="inline-flex items-center gap-2 text-gray-500">
                  {m.label}
                </Select.ItemText>
                <Select.ItemIndicator>
                  <CheckIcon className="size-3 text-blue-600" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton />
          <Select.Arrow />
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}