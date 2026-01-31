"use client";

import { ConsumptionMethod } from "@prisma/client";
import { Loader2Icon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card"; //Adicionado de npx shadcn@2.3.0 add card

interface ConsumptionMethodOPtionProps {
  slug: string;
  imageUrl: string;
  imageAlt: string;
  buttonText: string;
  option: ConsumptionMethod;
}

const ConsumptionMethodOPtion = ({
  slug,
  imageUrl,
  imageAlt,
  buttonText,
  option,
}: ConsumptionMethodOPtionProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (isPending) return;
    startTransition(() => {
      router.push(`/${slug}/menu?consumptionMethod=${option}`);
    });
  };

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-7 py-5 px-3">
        <div className="relative h-[67px] w-[67px]">
          {/* [] serve para dizer que este elemento ocupara exatamente 80px */}
          <Image
            src={imageUrl}
            fill
            // fill diz que vai ocupar 100% da largura e altura do pai
            alt={imageAlt}
            className="object-contain"
          ></Image>
        </div>

        <Button
          variant="secondary"
          className="rounded-full"
          onClick={handleClick}
          disabled={isPending}
        >
          {isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Entrando..." : buttonText}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ConsumptionMethodOPtion;
