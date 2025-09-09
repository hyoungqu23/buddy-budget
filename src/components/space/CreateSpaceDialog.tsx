"use client";
import { createSpace } from "@/app/actions/space";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "스페이스 이름을 입력하세요"),
});

type Props = {
  defaultOpen?: boolean;
  triggerClassName?: string;
};

const CreateSpaceDialog = ({
  defaultOpen = false,
  triggerClassName,
}: Props) => {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className={triggerClassName}>
          새 스페이스 만들기
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 스페이스 생성</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              try {
                const fd = new FormData();
                fd.set("name", values.name);
                await createSpace(fd); // redirect on success
              } catch (e: any) {
                form.setError("name", {
                  message: e?.message || "생성에 실패했습니다",
                });
              }
            })}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>스페이스 이름</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 신림 3인하우스" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit">만들기</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSpaceDialog;
