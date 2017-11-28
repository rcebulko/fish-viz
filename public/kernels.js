// must be loaded after `dispatch`
(function (exports) {

    function uniform(u) {
        if (u < -1 || u > 1)
            return 0;
        return .5;
    }

    function triangular(u) {
        if (u < -1 || u > 1)
            return 0;
        return 1 - Math.abs(u);
    }

    function triweight(u) {
        if (u < -1 || u > 1)
            return 0;
        var v = 1 - u * u;
        return v * v * v * 35 / 32;
    }

    function epanechikov(u) {
        if (u < -1 || u > 1)
            return 0;
        return (1 - u * u) * 3 / 4;
    }

    var kname;
    function setKernel(kname_) {
        kname = kname_;
    }

    exports.Kernels = {
        uniform,
        triangular,
        triweight,
        epanechikov,
        setKernel,
    }

    exports.Kernels.kernel = function(u) {
        return exports.Kernels[kname](u);
    }

}(window));

function select_kernel_onchange() {
    var kname = document.querySelector('select.filter.kernel').value;
    Kernels.setKernel(kname);
    dispatch.call('kernel_changed', null);
}
select_kernel_onchange();
