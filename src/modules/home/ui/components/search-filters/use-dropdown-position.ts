import { RefObject } from "react";

export const useDropdownPosition = (
    ref: RefObject<HTMLDivElement | null> | RefObject<HTMLDivElement>
) => {
    const getDropdownPosition = () => {
        if (!ref.current) return {top:0, left:0};

        const rect = ref.current.getBoundingClientRect();
        const dropdownWidth = 240; 

        // Calc the initial position
        let left = rect.left + window.scrollX;
        const top = rect.bottom + window.scrollY;

        // Check if dropdown would go off  the right  edge of viewport
        if (left + dropdownWidth > window.innerWidth) {
            //Align to right edge of button
            left = rect.right + window.scrollX - dropdownWidth;

            // if still offscreen, align to right edge of viewport with some padding 
            if (left < 0) {
                left = window.innerWidth - dropdownWidth - 16;
            }
        }

        // ensure drop down doesn't go off left edge 
        if (left <0) {
            left = 16;
        }
        return {top, left};
    };

    return {getDropdownPosition };
};