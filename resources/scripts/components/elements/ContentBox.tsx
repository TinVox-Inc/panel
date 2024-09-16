import FlashMessageRender from '@/components/FlashMessageRender';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';

type Props = Readonly<
    React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> & {
        title?: string;
        borderColor?: string;
        showFlashes?: string | boolean;
        showLoadingOverlay?: boolean;
    }
>;

const ContentBox = ({ title, showFlashes, showLoadingOverlay, children, ...props }: Props) => (
    <div className='skeleton-anim-4 p-8 bg-[#ffffff09] border-[1px] border-[#ffffff11] shadow-sm rounded-xl' {...props}>
        {title && <h2 className={`skeleton-anim-4 font-extrabold mb-4  text-2xl`}>{title}</h2>}
        {showFlashes && <FlashMessageRender byKey={typeof showFlashes === 'string' ? showFlashes : undefined} />}
        <div>
            <SpinnerOverlay visible={showLoadingOverlay || false} />
            {children}
        </div>
    </div>
);

export default ContentBox;
