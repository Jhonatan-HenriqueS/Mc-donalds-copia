import { ConsumptionMethod } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

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
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-8 py-8">
        <div className="relative h-[80px] w-[80px]">
          {/* [] serve para dizer que este elemento ocupara exatamente 80px */}
          <Image
            src={imageUrl}
            fill
            // fill diz que vai ocupar 100% da largura e altura do pai
            alt={imageAlt}
            className="object-contain"
          ></Image>
        </div>

        <Button variant="secondary" className="rounded-full" asChild>
          <Link href={`/${slug}/menu?consumptionMethod=${option}`}>
            {/* asChild faz com que o botão e junto com o link se tornem uma tag a, para ser semantico */}
            {buttonText}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ConsumptionMethodOPtion;
