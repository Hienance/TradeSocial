import { parseAsBoolean, useQueryStates } from "nuqs";
import { success } from "zod";

export const useCheckoutStates = () => {
    return useQueryStates({
        success: parseAsBoolean.withDefault(false).withOptions({
            clearOnDefault: true,
        }),
        cancel: parseAsBoolean.withDefault(false).withOptions({
            clearOnDefault: true,
        }),
    })
}